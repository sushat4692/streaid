use std::sync::{Arc, Mutex};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use anyhow::Context;
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tokio::time::Duration;
use twitch_oauth2::Scope;

// Twitch tokens are stored as ONE keychain entry (JSON) instead of two, so
// macOS prompts once per launch instead of multiple times.
const TOKEN_SERVICE: &str = "streaid";
const TOKEN_ENTRY: &str = "twitch_tokens";
const LEGACY_ACCESS_KEY: &str = "twitch_access_token";
const LEGACY_REFRESH_KEY: &str = "twitch_refresh_token";

/// JSON blob persisted in the keychain. `saved_at_epoch` + `expires_in_secs`
/// let the app recompute the token expiry after a restart without touching
/// the keychain again, so the background refresh loop stays silent.
#[derive(Debug, Serialize, Deserialize, Clone)]
struct StoredTokens {
    access_token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    refresh_token: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    saved_at_epoch: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    expires_in_secs: Option<u64>,
}

fn now_unix_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn blob_expiry(blob: &StoredTokens) -> Option<Instant> {
    let saved = blob.saved_at_epoch?;
    let exp = blob.expires_in_secs?;
    let remaining = (saved + exp).saturating_sub(now_unix_secs());
    Some(Instant::now() + Duration::from_secs(remaining))
}

/// Write both tokens as a single keychain entry and clean up legacy entries.
fn save_tokens(access: &str, refresh: Option<&str>, expires_in_secs: Option<u64>) -> Result<()> {
    let blob = StoredTokens {
        access_token: access.to_string(),
        refresh_token: refresh.map(String::from),
        saved_at_epoch: Some(now_unix_secs()),
        expires_in_secs,
    };
    keyring::Entry::new(TOKEN_SERVICE, TOKEN_ENTRY)
        .set_password(&serde_json::to_string(&blob).context("serializing stored tokens")?)
        .context("saving tokens to keyring")?;
    let _ = keyring::Entry::new(TOKEN_SERVICE, LEGACY_ACCESS_KEY).delete_password();
    let _ = keyring::Entry::new(TOKEN_SERVICE, LEGACY_REFRESH_KEY).delete_password();
    Ok(())
}

fn load_tokens() -> Result<Option<StoredTokens>> {
    match keyring::Entry::new(TOKEN_SERVICE, TOKEN_ENTRY).get_password() {
        Ok(json) => serde_json::from_str(&json)
            .map(Some)
            .context("parsing stored tokens"),
        Err(keyring::Error::NoEntry) => migrate_legacy_tokens(),
        Err(e) => Err(e).context("reading tokens from keyring"),
    }
}

/// One-time migration from the old two-entry layout. Legacy entries have no
/// expiry metadata, so the refresh loop stays silent until the next auth.
fn migrate_legacy_tokens() -> Result<Option<StoredTokens>> {
    let access = match keyring::Entry::new(TOKEN_SERVICE, LEGACY_ACCESS_KEY).get_password() {
        Ok(at) => at,
        Err(_) => return Ok(None),
    };
    let refresh = keyring::Entry::new(TOKEN_SERVICE, LEGACY_REFRESH_KEY)
        .get_password()
        .ok();
    let blob = StoredTokens {
        access_token: access,
        refresh_token: refresh,
        saved_at_epoch: None,
        expires_in_secs: None,
    };
    let _ = keyring::Entry::new(TOKEN_SERVICE, TOKEN_ENTRY)
        .set_password(&serde_json::to_string(&blob).context("serializing migrated tokens")?);
    let _ = keyring::Entry::new(TOKEN_SERVICE, LEGACY_ACCESS_KEY).delete_password();
    let _ = keyring::Entry::new(TOKEN_SERVICE, LEGACY_REFRESH_KEY).delete_password();
    Ok(Some(blob))
}

fn delete_tokens() {
    let _ = keyring::Entry::new(TOKEN_SERVICE, TOKEN_ENTRY).delete_password();
    let _ = keyring::Entry::new(TOKEN_SERVICE, LEGACY_ACCESS_KEY).delete_password();
    let _ = keyring::Entry::new(TOKEN_SERVICE, LEGACY_REFRESH_KEY).delete_password();
}

pub fn has_stored_token() -> bool {
    load_tokens().map(|o| o.is_some()).unwrap_or(false)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceCodeInfo {
    pub verification_uri: String,
    pub user_code: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TokenInfo {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<u64>,
    pub scope: Option<String>,
    pub login: Option<String>,
    pub user_id: Option<String>,
}

pub struct InnerState {
    pub last_device_code: Option<String>,
    pub client_id: Option<String>,
    pub interval: Option<u64>,
    pub expires_at: Option<Instant>,
    pub token_expires_at: Option<Instant>,
}

type SharedState = Arc<Mutex<InnerState>>;

impl InnerState {
    pub fn new() -> Self {
        InnerState {
            last_device_code: None,
            client_id: None,
            interval: None,
            expires_at: None,
            token_expires_at: None,
        }
    }
}

pub fn shared_state() -> SharedState {
    Arc::new(Mutex::new(InnerState::new()))
}

fn client_id_file_path() -> Option<PathBuf> {
    dirs::config_dir().map(|mut d| {
        d.push("streaid");
        let _ = fs::create_dir_all(&d);
        d.push("client_id");
        d
    })
}

pub fn save_client_id(client_id: &str) -> Result<()> {
    if let Some(path) = client_id_file_path() {
        fs::write(&path, client_id).context("writing client_id file")?;
    }
    Ok(())
}

pub fn load_client_id() -> Result<Option<String>> {
    if let Some(path) = client_id_file_path() {
        match fs::read_to_string(&path) {
            Ok(s) => Ok(Some(s.trim().to_string())),
            Err(e) => match e.kind() {
                std::io::ErrorKind::NotFound => Ok(None),
                _ => Err(e).context("reading client_id file"),
            },
        }
    } else {
        Ok(None)
    }
}

fn user_info_file_path(key: &str) -> Option<PathBuf> {
    dirs::config_dir().map(|mut d| {
        d.push("streaid");
        d.push(key);
        d
    })
}

pub fn save_user_info(login: Option<&str>, user_id: Option<&str>) {
    if let Some(name) = login {
        if let Some(path) = user_info_file_path("twitch_login") {
            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::write(&path, name);
        }
    }
    if let Some(uid) = user_id {
        if let Some(path) = user_info_file_path("twitch_user_id") {
            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::write(&path, uid);
        }
    }
}

pub fn load_user_info() -> (Option<String>, Option<String>) {
    let login = user_info_file_path("twitch_login")
        .and_then(|p| fs::read_to_string(p).ok())
        .map(|s| s.trim().to_string());
    let user_id = user_info_file_path("twitch_user_id")
        .and_then(|p| fs::read_to_string(p).ok())
        .map(|s| s.trim().to_string());
    (login, user_id)
}

pub fn clear_user_info() {
    if let Some(p) = user_info_file_path("twitch_login") {
        let _ = fs::remove_file(p);
    }
    if let Some(p) = user_info_file_path("twitch_user_id") {
        let _ = fs::remove_file(p);
    }
}

// Start the device flow and save the builder in state
pub async fn start_device_flow(
    state: SharedState,
    client_id: &str,
    scopes: Vec<Scope>,
) -> Result<DeviceCodeInfo> {
    eprintln!(
        "start_device_flow: client_id={} scopes={:?}",
        client_id, scopes
    );
    let http = Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(15))
        .build()
        .context("building http client")?;

    let params = [
        ("client_id", client_id.to_string()),
        (
            "scopes",
            scopes
                .iter()
                .map(|s| s.as_str())
                .collect::<Vec<_>>()
                .join(" "),
        ),
    ];

    let res = http
        .post("https://id.twitch.tv/oauth2/device")
        .form(&params)
        .send()
        .await
        .context("requesting device code")?;
    let status = res.status();
    let body = res.text().await.context("reading device code response")?;
    if !status.is_success() {
        return Err(anyhow::anyhow!(
            "device code endpoint returned {}: {}",
            status,
            body
        ));
    }

    let code: twitch_oauth2::id::DeviceCodeResponse = match serde_json::from_str(&body) {
        Ok(c) => c,
        Err(e) => {
            return Err(e).context(format!("parsing device code response: {}", body));
        }
    };

    // Save the device_code and metadata to shared state so polling can use it later.
    if let Ok(mut s) = state.lock() {
        s.last_device_code = Some(code.device_code.clone());
        s.client_id = Some(client_id.to_string());
        s.interval = Some(code.interval);
        s.expires_at = Some(Instant::now() + Duration::from_secs(code.expires_in));
    }

    Ok(DeviceCodeInfo {
        verification_uri: code.verification_uri.clone(),
        user_code: code.user_code.clone(),
        expires_in: code.expires_in,
        interval: code.interval,
    })
}

// Fetch user info (login, user_id) from Twitch API using access token
async fn fetch_user_info(
    http: &Client,
    access_token: &str,
    client_id: &str,
) -> Result<(Option<String>, Option<String>)> {
    let res = http
        .get("https://api.twitch.tv/helix/users")
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Client-Id", client_id)
        .send()
        .await
        .context("fetching user info")?;

    let body = res.text().await.context("reading user info response")?;
    let v: Value = serde_json::from_str(&body).context("parsing user info")?;

    if let Some(data) = v.get("data").and_then(|d| d.as_array()) {
        if let Some(user) = data.first() {
            let login = user
                .get("login")
                .and_then(|l| l.as_str())
                .map(|s| s.to_string());
            let user_id = user
                .get("id")
                .and_then(|i| i.as_str())
                .map(|s| s.to_string());
            return Ok((login, user_id));
        }
    }

    Ok((None, None))
}

// Poll until user authorizes or flow expires
pub async fn poll_device_flow(state: SharedState) -> Result<Option<TokenInfo>> {
    eprintln!("poll_device_flow: called");
    // Extract required info from state
    let (device_code, client_id, _interval, expires_at) = {
        let s = state
            .lock()
            .map_err(|e| anyhow::anyhow!("state lock poisoned: {}", e))?;
        let device_code = match &s.last_device_code {
            Some(c) => c.clone(),
            None => return Ok(None),
        };
        let client_id = match &s.client_id {
            Some(c) => c.clone(),
            None => return Ok(None),
        };
        (
            device_code,
            client_id,
            s.interval.unwrap_or(5),
            s.expires_at,
        )
    };

    let http = Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .context("building http client")?;

    // Single-shot polling: perform one token request and return result.
    if let Some(exp) = expires_at {
        if Instant::now() > exp {
            return Ok(None);
        }
    }

    let params = [
        ("client_id", client_id.clone()),
        (
            "grant_type",
            "urn:ietf:params:oauth:grant-type:device_code".to_string(),
        ),
        ("device_code", device_code.clone()),
    ];

    let res = http
        .post("https://id.twitch.tv/oauth2/token")
        .form(&params)
        .send()
        .await
        .context("requesting token endpoint")?;

    let status = res.status();
    let body = res.text().await.context("reading token response")?;

    if status.is_success() {
        let v: Value = serde_json::from_str(&body).context("parsing token success response")?;
        if let Some(at) = v.get("access_token").and_then(|v| v.as_str()) {
            let mut refresh_opt: Option<String> = None;
            if let Some(rt) = v.get("refresh_token").and_then(|v| v.as_str()) {
                refresh_opt = Some(rt.to_string());
            }
            let expires_in = v.get("expires_in").and_then(|v| v.as_u64());
            let scope = v
                .get("scope")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            // Persist tokens as a single keychain entry
            save_tokens(at, refresh_opt.as_deref(), expires_in)
                .context("saving tokens to keyring")?;
            eprintln!("poll_device_flow: tokens stored");

            // Fetch user info from Twitch API
            let (login, user_id) = fetch_user_info(&http, at, &client_id)
                .await
                .unwrap_or((None, None));

            // Save login/user_id to disk
            save_user_info(login.as_deref(), user_id.as_deref());

            let info = TokenInfo {
                access_token: at.to_string(),
                refresh_token: refresh_opt,
                expires_in,
                scope,
                login,
                user_id,
            };

            // update state token expiry and clear device code to stop further polling
            if let Ok(mut s) = state.lock() {
                if let Some(exp_secs) = expires_in {
                    s.token_expires_at = Some(Instant::now() + Duration::from_secs(exp_secs));
                }
                s.last_device_code = None;
            }

            return Ok(Some(info));
        } else {
            return Ok(None);
        }
    } else {
        let v: Value = serde_json::from_str(&body).unwrap_or_default();
        if let Some(err) = v.get("error").and_then(|e| e.as_str()) {
            match err {
                "authorization_pending" => {
                    return Ok(None);
                }
                "slow_down" => {
                    // Frontend may increase polling interval; return pending for now
                    return Ok(None);
                }
                "expired_token" | "access_denied" => {
                    // Clear device code to stop further polling
                    if let Ok(mut s) = state.lock() {
                        s.last_device_code = None;
                    }
                    return Ok(None);
                }
                other => {
                    return Err(anyhow::anyhow!("token endpoint error: {}", other));
                }
            }
        } else if let Some(msg) = v.get("message").and_then(|m| m.as_str()) {
            // Some Twitch responses include {status:400, message:"authorization_pending"}
            match msg {
                "authorization_pending" => return Ok(None),
                "slow_down" => return Ok(None),
                "expired_token" | "access_denied" => {
                    if let Ok(mut s) = state.lock() {
                        s.last_device_code = None;
                    }
                    return Ok(None);
                }
                other => return Err(anyhow::anyhow!("token endpoint message: {}", other)),
            }
        } else {
            return Err(anyhow::anyhow!("unexpected token response: {}", body));
        }
    }
}

// Read stored tokens from OS keyring (if present). Also records the token
// expiry in `state` so the background refresh loop doesn't need to touch the
// keychain repeatedly after a restart.
pub fn get_stored_token(state: &SharedState) -> Result<Option<TokenInfo>> {
    let blob = match load_tokens()? {
        Some(b) => b,
        None => return Ok(None),
    };
    let (login, user_id) = load_user_info();
    if let Ok(mut s) = state.lock() {
        s.token_expires_at = blob_expiry(&blob);
    }
    Ok(Some(TokenInfo {
        access_token: blob.access_token,
        refresh_token: blob.refresh_token,
        expires_in: blob.expires_in_secs,
        scope: None,
        login,
        user_id,
    }))
}

// Remove stored tokens from OS keyring
pub fn clear_stored_token() -> Result<()> {
    delete_tokens();
    clear_user_info();
    Ok(())
}

// Refresh token using stored refresh token. Returns new TokenInfo if refreshed.
pub async fn refresh_token(state: SharedState) -> Result<Option<TokenInfo>> {
    let refresh = match load_tokens()? {
        Some(blob) => match blob.refresh_token {
            Some(rt) => rt,
            None => return Ok(None),
        },
        None => return Ok(None),
    };

    // need client_id from state
    let client_id = {
        let s = state
            .lock()
            .map_err(|e| anyhow::anyhow!("state lock poisoned: {}", e))?;
        match &s.client_id {
            Some(c) => c.clone(),
            None => match load_client_id() {
                Ok(Some(id)) => id,
                _ => return Ok(None),
            },
        }
    };

    let http = Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .context("building http client")?;

    let params = [
        ("grant_type", "refresh_token".to_string()),
        ("refresh_token", refresh.clone()),
        ("client_id", client_id.clone()),
    ];

    let res = http
        .post("https://id.twitch.tv/oauth2/token")
        .form(&params)
        .send()
        .await
        .context("requesting token refresh")?;

    let status = res.status();
    let body = res.text().await.context("reading refresh response")?;
    if !status.is_success() {
        return Err(anyhow::anyhow!("refresh failed: {}", body));
    }

    let v: Value = serde_json::from_str(&body).context("parsing refresh response")?;
    let at = v
        .get("access_token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow::anyhow!("no access_token in refresh response"))?;

    let mut refresh_opt: Option<String> = None;
    if let Some(rt) = v.get("refresh_token").and_then(|v| v.as_str()) {
        refresh_opt = Some(rt.to_string());
    }
    let expires_in = v.get("expires_in").and_then(|v| v.as_u64());

    // Persist new tokens (single keychain entry)
    save_tokens(at, refresh_opt.as_deref(), expires_in)
        .context("saving refreshed tokens to keyring")?;

    let scope = v
        .get("scope")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    // Fetch user info from Twitch API
    let (login, user_id) = fetch_user_info(&http, at, &client_id)
        .await
        .unwrap_or((None, None));

    // Save login/user_id to disk if we got it
    save_user_info(login.as_deref(), user_id.as_deref());

    // Fallback: if we failed to fetch (e.g. network glitch but token likely valid), try to read from disk
    let (fallback_login, fallback_user_id) = load_user_info();
    let login = login.or(fallback_login);
    let user_id = user_id.or(fallback_user_id);

    let info = TokenInfo {
        access_token: at.to_string(),
        refresh_token: refresh_opt,
        expires_in,
        scope,
        login,
        user_id,
    };

    // update state token expiry
    if let Some(exp_secs) = expires_in {
        if let Ok(mut s) = state.lock() {
            s.token_expires_at = Some(Instant::now() + Duration::from_secs(exp_secs));
        }
    }

    Ok(Some(info))
}

// Check if token needs refresh (e.g., expires within next `threshold_secs`) and refresh if needed
pub async fn refresh_token_if_needed(
    state: SharedState,
    threshold_secs: u64,
) -> Result<Option<TokenInfo>> {
    let needs = {
        let s = state
            .lock()
            .map_err(|e| anyhow::anyhow!("state lock poisoned: {}", e))?;
        match s.token_expires_at {
            Some(exp) => {
                let now = Instant::now();
                if exp <= now || exp <= now + Duration::from_secs(threshold_secs) {
                    true
                } else {
                    false
                }
            }
            // Expiry unknown (fresh start before `get_stored_token` runs, or
            // legacy tokens without metadata). Do NOT touch the keychain here —
            // the expiry gets populated when the frontend checks the stored
            // token at startup, and `start_chat_listener_cmd` refreshes once.
            None => false,
        }
    };

    if needs {
        refresh_token(state).await
    } else {
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blob_expiry_computes_remaining_lifetime() {
        let blob = StoredTokens {
            access_token: "at".to_string(),
            refresh_token: None,
            saved_at_epoch: Some(now_unix_secs() - 100),
            expires_in_secs: Some(200),
        };
        let expiry = blob_expiry(&blob).expect("expiry should be computable");
        let remaining = expiry.duration_since(Instant::now()).as_secs();
        assert!(
            (90..=110).contains(&remaining),
            "expected ~100s remaining, got {}",
            remaining
        );
    }

    #[test]
    fn test_blob_expiry_none_when_metadata_missing() {
        let blob = StoredTokens {
            access_token: "at".to_string(),
            refresh_token: Some("rt".to_string()),
            saved_at_epoch: None,
            expires_in_secs: None,
        };
        assert!(blob_expiry(&blob).is_none());
    }
}
