use std::sync::{Arc, Mutex};
use std::time::Instant;

use anyhow::Context;
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::time::{sleep, Duration};
use twitch_oauth2::Scope;

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

// Start the device flow and save the builder in state
pub async fn start_device_flow(
    state: SharedState,
    client_id: &str,
    scopes: Vec<Scope>,
) -> Result<DeviceCodeInfo> {
    let http = Client::builder()
        .redirect(reqwest::redirect::Policy::none())
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

// Poll until user authorizes or flow expires
pub async fn poll_device_flow(state: SharedState) -> Result<Option<TokenInfo>> {
    // Extract required info from state
    let (device_code, client_id, mut interval, expires_at) = {
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

    let http = Client::new();

    loop {
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
                // Persist tokens to OS keyring
                let service = "streaid";
                let access_key = "twitch_access_token";
                if let Err(e) = keyring::Entry::new(service, access_key).set_password(at) {
                    // If keyring fails, return an error so the caller can handle it
                    return Err(e).context("saving access token to keyring");
                }
                let mut refresh_opt: Option<String> = None;
                if let Some(rt) = v.get("refresh_token").and_then(|v| v.as_str()) {
                    let refresh_key = "twitch_refresh_token";
                    if let Err(e) = keyring::Entry::new(service, refresh_key).set_password(rt) {
                        return Err(e).context("saving refresh token to keyring");
                    }
                    refresh_opt = Some(rt.to_string());
                }

                let expires_in = v.get("expires_in").and_then(|v| v.as_u64());
                let scope = v
                    .get("scope")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let info = TokenInfo {
                    access_token: at.to_string(),
                    refresh_token: refresh_opt,
                    expires_in,
                    scope,
                };

                // update state token expiry
                if let Some(exp_secs) = expires_in {
                    if let Ok(mut s) = state.lock() {
                        s.token_expires_at = Some(Instant::now() + Duration::from_secs(exp_secs));
                    }
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
                        sleep(Duration::from_secs(interval)).await;
                        continue;
                    }
                    "slow_down" => {
                        interval = interval.saturating_add(5);
                        sleep(Duration::from_secs(interval)).await;
                        continue;
                    }
                    "expired_token" | "access_denied" => {
                        return Ok(None);
                    }
                    other => {
                        return Err(anyhow::anyhow!("token endpoint error: {}", other));
                    }
                }
            } else {
                return Err(anyhow::anyhow!("unexpected token response: {}", body));
            }
        }
    }
}

// Read stored tokens from OS keyring (if present)
pub fn get_stored_token() -> Result<Option<TokenInfo>> {
    let service = "streaid";
    let access_key = "twitch_access_token";

    match keyring::Entry::new(service, access_key).get_password() {
        Ok(at) => {
            let refresh = match keyring::Entry::new(service, "twitch_refresh_token").get_password()
            {
                Ok(rt) => Some(rt),
                Err(_) => None,
            };
            Ok(Some(TokenInfo {
                access_token: at,
                refresh_token: refresh,
                expires_in: None,
                scope: None,
            }))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e).context("reading token from keyring"),
    }
}

// Remove stored tokens from OS keyring
pub fn clear_stored_token() -> Result<()> {
    let service = "streaid";
    let access_key = "twitch_access_token";
    let _ = keyring::Entry::new(service, access_key).delete_password();
    let _ = keyring::Entry::new(service, "twitch_refresh_token").delete_password();
    Ok(())
}

// Refresh token using stored refresh token. Returns new TokenInfo if refreshed.
pub async fn refresh_token(state: SharedState) -> Result<Option<TokenInfo>> {
    let service = "streaid";
    let refresh = match keyring::Entry::new(service, "twitch_refresh_token").get_password() {
        Ok(rt) => rt,
        Err(_) => return Ok(None),
    };

    // need client_id from state
    let client_id = {
        let s = state
            .lock()
            .map_err(|e| anyhow::anyhow!("state lock poisoned: {}", e))?;
        match &s.client_id {
            Some(c) => c.clone(),
            None => return Ok(None),
        }
    };

    let http = Client::new();

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

    // Persist new tokens
    if let Err(e) = keyring::Entry::new(service, "twitch_access_token").set_password(at) {
        return Err(e).context("saving refreshed access token");
    }
    let mut refresh_opt: Option<String> = None;
    if let Some(rt) = v.get("refresh_token").and_then(|v| v.as_str()) {
        if let Err(e) = keyring::Entry::new(service, "twitch_refresh_token").set_password(rt) {
            return Err(e).context("saving refreshed refresh token");
        }
        refresh_opt = Some(rt.to_string());
    }

    let expires_in = v.get("expires_in").and_then(|v| v.as_u64());
    let scope = v
        .get("scope")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let info = TokenInfo {
        access_token: at.to_string(),
        refresh_token: refresh_opt,
        expires_in,
        scope,
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
            None => false,
        }
    };

    if needs {
        refresh_token(state).await
    } else {
        Ok(None)
    }
}
