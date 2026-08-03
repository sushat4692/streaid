// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod auth;
mod bonsai;
mod chat;
mod dictionary;
mod overlay;
mod sounds;
mod translate;

use auth::{
    poll_device_flow, shared_state, start_device_flow, DeviceCodeInfo, InnerState, TokenInfo,
};
use chat::{
    connect_to_irc, extract_dictionary_word, extract_translate_text, is_dictionary_command,
    is_translate_command, parse_irc_privmsg, send_chat_message, send_pong, WsStream,
};
use dictionary::lookup_word;
use futures_util::StreamExt;
use once_cell::sync::Lazy;
use std::sync::Arc;
use std::time::Duration;
use tauri::async_runtime;
use tauri::{Emitter, Manager};
use tokio::time::sleep;
use tokio_tungstenite::tungstenite::Message;
use translate::{detect_language, translate_text, Language, TranslationSuggestion};

static AUTH_STATE: Lazy<Arc<std::sync::Mutex<InnerState>>> = Lazy::new(|| shared_state());

// Chat state
struct ChatState {
    is_running: bool,
    is_enabled: bool,
    channel_name: Option<String>,
    bot_username: Option<String>,
}

impl ChatState {
    fn new() -> Self {
        ChatState {
            is_running: false,
            is_enabled: true,
            channel_name: None,
            bot_username: None,
        }
    }
}

static CHAT_STATE: Lazy<Arc<std::sync::Mutex<ChatState>>> =
    Lazy::new(|| Arc::new(std::sync::Mutex::new(ChatState::new())));

// Bonsai (local model sidecar) state
struct BonsaiState {
    enabled: bool,
    child: Option<std::process::Child>,
}

impl BonsaiState {
    fn new() -> Self {
        BonsaiState {
            enabled: false,
            child: None,
        }
    }
}

static BONSAI_STATE: Lazy<Arc<std::sync::Mutex<BonsaiState>>> =
    Lazy::new(|| Arc::new(std::sync::Mutex::new(BonsaiState::new())));

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Shared state for auth

fn get_auth_state() -> std::sync::Arc<std::sync::Mutex<InnerState>> {
    AUTH_STATE.clone()
}

fn get_chat_state() -> Arc<std::sync::Mutex<ChatState>> {
    CHAT_STATE.clone()
}

#[tauri::command]
async fn start_device_flow_cmd(
    client_id: String,
    scopes: Vec<String>,
) -> Result<DeviceCodeInfo, String> {
    let state = get_auth_state();
    let scopes_conv = scopes
        .into_iter()
        .filter_map(|s| match s.as_str() {
            "chat_read" | "chat:read" => Some(twitch_oauth2::Scope::ChatRead),
            "chat_edit" | "chat:edit" => Some(twitch_oauth2::Scope::ChatEdit),
            _ => None,
        })
        .collect();

    match start_device_flow(state, &client_id, scopes_conv).await {
        Ok(info) => Ok(info),
        Err(e) => Err(format!("start_device_flow failed: {}", e)),
    }
}

#[tauri::command]
async fn poll_device_flow_cmd() -> Result<Option<TokenInfo>, String> {
    let state = get_auth_state();
    match poll_device_flow(state).await {
        Ok(Some(token_info)) => Ok(Some(token_info)),
        Ok(None) => Ok(None),
        Err(e) => Err(format!("poll_device_flow failed: {}", e)),
    }
}

#[tauri::command]
fn get_stored_token_cmd() -> Result<Option<TokenInfo>, String> {
    match auth::get_stored_token() {
        Ok(Some(t)) => Ok(Some(t)),
        Ok(None) => Ok(None),
        Err(e) => Err(format!("get_stored_token failed: {}", e)),
    }
}

#[tauri::command]
fn clear_stored_token_cmd() -> Result<(), String> {
    match auth::clear_stored_token() {
        Ok(()) => Ok(()),
        Err(e) => Err(format!("clear_stored_token failed: {}", e)),
    }
}

#[tauri::command]
async fn refresh_token_cmd() -> Result<Option<TokenInfo>, String> {
    let state = get_auth_state();
    match auth::refresh_token(state).await {
        Ok(Some(info)) => Ok(Some(info)),
        Ok(None) => Ok(None),
        Err(e) => Err(format!("refresh_token failed: {}", e)),
    }
}

#[tauri::command]
fn open_url_cmd(_app: tauri::AppHandle, url: String) -> Result<(), String> {
    // Use the `open` crate to launch the URL in the system default browser
    match open::that(url) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("open_url failed: {}", e)),
    }
}

#[derive(serde::Serialize)]
struct DebugTokenStatus {
    has_device_code: bool,
    has_stored_token: bool,
}

#[derive(serde::Serialize, Clone)]
struct ChatStatus {
    connected: bool,
    is_running: bool,
    is_enabled: bool,
    channel: Option<String>,
    last_target_channel: Option<String>,
}

#[derive(serde::Serialize, Clone)]
struct TranslationEvent {
    original_user: String,
    original_message: String,
    suggestions: Vec<TranslationSuggestion>,
    points: Vec<String>,
    timestamp: String,
    source_lang: String,
    target_lang: String,
}

#[derive(serde::Serialize, Clone)]
struct DictionaryEvent {
    original_user: String,
    original_word: String,
    word: String,
    meaning: String,
    examples: Vec<String>,
    similar_words: Vec<String>,
    timestamp: String,
    source_lang: String,
    target_lang: String,
}

#[derive(serde::Serialize, Clone)]
struct ChatMessageEvent {
    username: String,
    message: String,
    channel: String,
    timestamp: String,
}

#[tauri::command]
fn debug_token_status() -> Result<DebugTokenStatus, String> {
    let state = get_auth_state();
    let has_device_code = match state.lock() {
        Ok(s) => s.last_device_code.is_some(),
        Err(_) => false,
    };
    let has_stored_token =
        match keyring::Entry::new("streaid", "twitch_access_token").get_password() {
            Ok(_) => true,
            Err(_) => false,
        };
    Ok(DebugTokenStatus {
        has_device_code,
        has_stored_token,
    })
}

#[tauri::command]
fn set_client_id_cmd(client_id: String) -> Result<(), String> {
    match auth::save_client_id(&client_id) {
        Ok(()) => Ok(()),
        Err(e) => Err(format!("set_client_id failed: {}", e)),
    }
}

#[tauri::command]
fn get_client_id_cmd() -> Result<Option<String>, String> {
    match auth::load_client_id() {
        Ok(opt) => Ok(opt),
        Err(e) => Err(format!("get_client_id failed: {}", e)),
    }
}

// Chat commands

#[tauri::command]
fn set_gemini_api_key_cmd(api_key: String) -> Result<(), String> {
    keyring::Entry::new("streaid", "gemini_api_key")
        .set_password(&api_key)
        .map_err(|e| format!("Failed to save Gemini API key: {}", e))
}

#[tauri::command]
fn get_gemini_api_key_cmd() -> Result<Option<String>, String> {
    match keyring::Entry::new("streaid", "gemini_api_key").get_password() {
        Ok(key) => {
            // Return masked version for security
            if key.len() > 8 {
                Ok(Some(format!("{}...{}", &key[..4], &key[key.len() - 4..])))
            } else {
                Ok(Some("***".to_string()))
            }
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to get Gemini API key: {}", e)),
    }
}

fn sanitize_channel_name(raw: &str) -> Result<String, String> {
    let s = raw.trim().to_lowercase();
    let s = s.trim_start_matches('#').to_string();
    if s.contains(' ') {
        return Err("Channel name cannot contain spaces".to_string());
    }
    if s.len() > 25 {
        return Err("Channel name is too long (max 25 characters)".to_string());
    }
    if !s.is_empty() && !s.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err("Channel name can only contain letters, numbers, and underscores".to_string());
    }
    Ok(s)
}

fn truncate_utf8(s: &str, max_bytes: usize) -> &str {
    let safe_len = s.floor_char_boundary(max_bytes.min(s.len()));
    &s[..safe_len]
}

fn last_channel_file_path() -> Option<std::path::PathBuf> {
    dirs::config_dir().map(|mut d| {
        d.push("streaid");
        d.push("last_channel");
        d
    })
}

/// Save last used target channel to disk
fn save_last_channel(channel: &str) -> Result<(), String> {
    if let Some(path) = last_channel_file_path() {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        std::fs::write(&path, channel).map_err(|e| format!("Failed to save last channel: {}", e))
    } else {
        Err("Could not determine config directory".to_string())
    }
}

/// Load last used target channel from disk
fn load_last_channel() -> Result<Option<String>, String> {
    if let Some(path) = last_channel_file_path() {
        match std::fs::read_to_string(&path) {
            Ok(s) => Ok(Some(s.trim().to_string())),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(format!("Failed to load last channel: {}", e)),
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn get_chat_status_cmd() -> Result<ChatStatus, String> {
    let state = get_chat_state();
    let s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(ChatStatus {
        connected: s.is_running,
        is_running: s.is_running,
        is_enabled: s.is_enabled,
        channel: s.channel_name.clone(),
        last_target_channel: load_last_channel().ok().flatten(),
    })
}

#[tauri::command]
fn toggle_translation_cmd(enabled: bool) -> Result<(), String> {
    let state = get_chat_state();
    let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    s.is_enabled = enabled;
    eprintln!("Translation toggled: {}", enabled);
    Ok(())
}

// ── Bonsai (local model sidecar) ─────────────────────────────────────────────

fn get_bonsai_state() -> Arc<std::sync::Mutex<BonsaiState>> {
    BONSAI_STATE.clone()
}

fn bonsai_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    app.path().app_data_dir().unwrap_or_default().join("bonsai")
}

const BONSAI_MODEL_FILE: &str = "Ternary-Bonsai-8B-Q2_0.gguf";

#[derive(serde::Serialize)]
struct BonsaiStatus {
    enabled: bool,
    server_running: bool,
    binary_found: bool,
    model_found: bool,
}

/// Spawns (or kills) the local llama-server sidecar and switches the
/// !ts / !d provider to the local Bonsai model.
#[tauri::command]
async fn set_local_model_cmd(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    if enabled {
        start_bonsai(&app).await
    } else {
        stop_bonsai();
        eprintln!("Local model disabled");
        Ok(())
    }
}

#[tauri::command]
async fn get_bonsai_status_cmd(app: tauri::AppHandle) -> Result<BonsaiStatus, String> {
    let dir = bonsai_dir(&app);
    let (enabled, has_child) = {
        let state = get_bonsai_state();
        let s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        (s.enabled, s.child.is_some())
    };
    Ok(BonsaiStatus {
        enabled,
        server_running: has_child && bonsai::server_ready().await,
        binary_found: dir.join("bin").join("llama-server").exists(),
        model_found: dir.join("models").join(BONSAI_MODEL_FILE).exists(),
    })
}

#[derive(serde::Serialize)]
struct ModelTestResult {
    source_lang: String,
    target_lang: String,
    suggestions: Vec<TranslationSuggestion>,
    points: Vec<String>,
    duration_ms: u64,
}

/// One-shot translation with a chosen provider, used by the dashboard's
/// Gemini vs local model comparison UI.
#[tauri::command]
async fn test_translation_cmd(text: String, provider: String) -> Result<ModelTestResult, String> {
    let source_lang = detect_language(&text);
    if source_lang == Language::Unknown {
        return Err("Unknown language".to_string());
    }
    let target_lang = match source_lang {
        Language::Japanese => "English",
        Language::English => "Japanese",
        Language::Unknown => "Unknown",
    };

    let start = std::time::Instant::now();
    let result = match provider.as_str() {
        "gemini" => {
            let api_key = keyring::Entry::new("streaid", "gemini_api_key")
                .get_password()
                .map_err(|_| "No Gemini API key configured".to_string())?;
            translate_text(&text, &api_key, source_lang)
                .await
                .map_err(|e| format!("Gemini error: {}", e))?
        }
        "bonsai" => {
            if !bonsai::server_ready().await {
                return Err(
                    "Local model server is not running. Enable Local Model in Chat Listener first."
                        .to_string(),
                );
            }
            bonsai::translate(&text, source_lang)
                .await
                .map_err(|e| format!("Local model error: {}", e))?
        }
        other => return Err(format!("Unknown provider: {}", other)),
    };
    let duration_ms = start.elapsed().as_millis() as u64;

    Ok(ModelTestResult {
        source_lang: source_lang.to_string(),
        target_lang: target_lang.to_string(),
        suggestions: result.suggestions,
        points: result.points,
        duration_ms,
    })
}

async fn start_bonsai(app: &tauri::AppHandle) -> Result<(), String> {
    let dir = bonsai_dir(app);
    let bin = dir.join("bin").join("llama-server");
    let model = dir.join("models").join(BONSAI_MODEL_FILE);

    if !bin.exists() {
        return Err(
            "llama-server binary not found. Run scripts/setup-bonsai.sh first.".to_string(),
        );
    }
    if !model.exists() {
        return Err(format!(
            "Model file {} not found. Run scripts/setup-bonsai.sh first.",
            BONSAI_MODEL_FILE
        ));
    }

    {
        let state = get_bonsai_state();
        let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        if s.enabled && s.child.is_some() {
            return Ok(());
        }
        if s.child.is_some() {
            // Clean up a stale handle before re-spawning
            if let Some(mut old) = s.child.take() {
                let _ = old.kill();
                let _ = old.wait();
            }
        }

        std::fs::create_dir_all(&dir).map_err(|e| format!("Failed to create bonsai dir: {}", e))?;
        let log_file = std::fs::File::create(dir.join("llama-server.log"))
            .map_err(|e| format!("Failed to open llama-server log: {}", e))?;

        let child = std::process::Command::new(&bin)
            .arg("-m")
            .arg(&model)
            .arg("--host")
            .arg("127.0.0.1")
            .arg("--port")
            .arg("4243")
            .arg("-c")
            .arg("8192")
            .arg("--jinja")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::from(log_file))
            .spawn()
            .map_err(|e| format!("Failed to start llama-server: {}", e))?;

        s.child = Some(child);
        s.enabled = true;
    };

    eprintln!(
        "llama-server started (log: {})",
        dir.join("llama-server.log").display()
    );

    // Wait for the server to become ready (model load takes a few seconds)
    let mut attempts = 0;
    while attempts < 60 {
        if bonsai::server_ready().await {
            eprintln!("llama-server is ready");
            return Ok(());
        }
        tokio::time::sleep(Duration::from_secs(1)).await;
        attempts += 1;
    }

    stop_bonsai();
    Err("llama-server did not become ready within 60s (check bonsai/llama-server.log)".to_string())
}

fn stop_bonsai() {
    let state = get_bonsai_state();
    let mut s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(mut child) = s.child.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    s.enabled = false;
    s.child = None;
}

#[derive(serde::Serialize)]
struct SoundDataResponse {
    data_url: String,
    file_name: String,
}

#[tauri::command]
async fn set_sound_cmd(
    app: tauri::AppHandle,
    sound_type: String,
    data: Vec<u8>,
    file_name: String,
) -> Result<(), String> {
    sounds::save_sound(&app, &sound_type, &data, &file_name)
        .map_err(|e| format!("Failed to save sound: {}", e))
}

#[tauri::command]
async fn get_sound_cmd(
    app: tauri::AppHandle,
    sound_type: String,
) -> Result<Option<SoundDataResponse>, String> {
    sounds::get_sound(&app, &sound_type)
        .map_err(|e| format!("Failed to get sound: {}", e))
        .map(|opt| {
            opt.map(|s| SoundDataResponse {
                data_url: s.data_url,
                file_name: s.file_name,
            })
        })
}

#[tauri::command]
async fn clear_sound_cmd(app: tauri::AppHandle, sound_type: String) -> Result<(), String> {
    sounds::delete_sound(&app, &sound_type).map_err(|e| format!("Failed to clear sound: {}", e))
}

#[tauri::command]
async fn start_chat_listener_cmd(
    app: tauri::AppHandle,
    target_channel: Option<String>, // NEW: Optional channel parameter
) -> Result<(), String> {
    eprintln!("Starting chat listener...");

    // Attempt a proactive token refresh before connecting.
    let auth_state = get_auth_state();
    let refreshed_token = auth::refresh_token_if_needed(auth_state, 300)
        .await
        .ok()
        .flatten();

    let token = if let Some(t) = refreshed_token {
        eprintln!("Using refreshed token for IRC connection");
        t
    } else {
        auth::get_stored_token()
            .map_err(|e| format!("Failed to get token: {}", e))?
            .ok_or_else(|| "No token found. Please authenticate first.".to_string())?
    };

    let username = token
        .login
        .ok_or_else(|| "No username found in token".to_string())?;

    let access_token = token.access_token;

    // Determine which channel to join
    let channel_to_join = if let Some(ch) = target_channel {
        let sanitized = sanitize_channel_name(&ch)?;
        if sanitized.is_empty() {
            username.clone() // Fallback to own channel if empty after sanitization
        } else {
            sanitized
        }
    } else {
        username.clone() // Default to own channel
    };

    eprintln!("Target channel: #{}", channel_to_join);

    // Save for persistence
    if let Err(e) = save_last_channel(&channel_to_join) {
        eprintln!("Warning: Failed to save last channel: {}", e);
    }

    // Debug: show token format (masked)
    eprintln!("Token format check:");
    eprintln!("  - Token length: {}", access_token.len());
    eprintln!(
        "  - Token prefix: {}",
        if access_token.len() > 10 {
            &access_token[..10]
        } else {
            &access_token
        }
    );
    eprintln!(
        "  - Has 'oauth:' prefix: {}",
        access_token.starts_with("oauth:")
    );

    eprintln!("Connecting as: {}", username);

    // Validate token before attempting IRC connection
    eprintln!("Validating token with Twitch API...");
    let client = reqwest::Client::new();
    let validation_response = client
        .get("https://id.twitch.tv/oauth2/validate")
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
        .map_err(|e| format!("Token validation request failed: {}", e))?;

    if !validation_response.status().is_success() {
        let status = validation_response.status();
        let error_text = validation_response.text().await.unwrap_or_default();
        return Err(format!(
            "Token validation failed ({}): {}. Please re-authenticate.",
            status, error_text
        ));
    }

    let validation_json: serde_json::Value = validation_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse validation response: {}", e))?;

    eprintln!("Token validation successful: {:?}", validation_json);

    // Check if token has required scopes
    if let Some(scopes) = validation_json.get("scopes").and_then(|s| s.as_array()) {
        let has_chat_read = scopes.iter().any(|s| s.as_str() == Some("chat:read"));
        let has_chat_edit = scopes.iter().any(|s| s.as_str() == Some("chat:edit"));

        if !has_chat_read || !has_chat_edit {
            return Err(format!(
                "Token missing required scopes. Has chat:read={}, chat:edit={}. Please re-authenticate with correct scopes.",
                has_chat_read, has_chat_edit
            ));
        }
        eprintln!("✓ Token has required scopes: chat:read, chat:edit");
    }

    // Update state
    {
        let state = get_chat_state();
        let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
        if s.is_running {
            return Err("Chat listener already running".to_string());
        }
        s.is_running = true;
        s.channel_name = Some(channel_to_join.clone());
        s.bot_username = Some(username.clone());
    }

    // Connect to IRC
    let ws_stream = connect_to_irc(&username, &access_token, &channel_to_join)
        .await
        .map_err(|e| {
            // Reset state on error
            let state = get_chat_state();
            if let Ok(mut s) = state.lock() {
                s.is_running = false;
            }
            format!("Failed to connect to IRC: {}", e)
        })?;

    eprintln!("IRC connected, starting listener task...");

    // Spawn background task
    async_runtime::spawn(async move {
        if let Err(e) = chat_listener_task(ws_stream, channel_to_join, app).await {
            eprintln!("Chat listener error: {}", e);
        }

        // Cleanup on exit
        let state = get_chat_state();
        if let Ok(mut s) = state.lock() {
            s.is_running = false;
            s.channel_name = None;
        }
        eprintln!("Chat listener stopped");
    });

    Ok(())
}

#[tauri::command]
fn get_overlay_url_cmd() -> String {
    "http://localhost:4242".to_string()
}

#[tauri::command]
fn stop_chat_listener_cmd() -> Result<(), String> {
    let state = get_chat_state();
    let mut s = state.lock().map_err(|e| format!("Lock error: {}", e))?;
    s.is_running = false;
    eprintln!("Stopping chat listener...");
    Ok(())
}

// Chat listener background task
async fn chat_listener_task(
    mut ws_stream: WsStream,
    channel: String,
    app: tauri::AppHandle,
) -> Result<(), anyhow::Error> {
    eprintln!("Chat listener task started for #{}", channel);

    loop {
        // Check if should continue
        let (should_continue, is_enabled, bot_username) = {
            let state = get_chat_state();
            let s = state.lock().unwrap();
            (s.is_running, s.is_enabled, s.bot_username.clone())
        };

        if !should_continue {
            eprintln!("Stopping chat listener (is_running = false)");
            break;
        }

        // Read message from WebSocket
        match ws_stream.next().await {
            Some(Ok(Message::Text(line))) => {
                // eprintln!("IRC << {}", line);

                // Handle PING
                if line.starts_with("PING") {
                    let server = line.trim_start_matches("PING ").trim_start_matches(':');
                    if let Err(e) = send_pong(&mut ws_stream, server).await {
                        eprintln!("Failed to send PONG: {}", e);
                    }
                    continue;
                }

                // Parse PRIVMSG
                if let Some(irc_msg) = parse_irc_privmsg(&line) {
                    eprintln!("Message from {}: {}", irc_msg.username, irc_msg.message);

                    // Ignore own messages (prevent loops)
                    if let Some(ref bot) = bot_username {
                        if irc_msg.username.eq_ignore_ascii_case(bot) {
                            eprintln!("Ignoring own message");
                            continue;
                        }
                    }

                    // Emit chat_message event for all user messages (fires regardless of toggle)
                    let chat_event = ChatMessageEvent {
                        username: irc_msg.username.clone(),
                        message: irc_msg.message.clone(),
                        channel: channel.clone(),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    };
                    if let Err(e) = app.emit("chat_message", chat_event) {
                        eprintln!("Failed to emit chat_message event: {}", e);
                    }

                    // Check if translation is enabled
                    if !is_enabled {
                        continue;
                    }

                    // Check for !ts command
                    if is_translate_command(&irc_msg.message) {
                        if let Some(text) = extract_translate_text(&irc_msg.message) {
                            eprintln!("Translation request: {}", text);

                            // Detect language
                            let source_lang = detect_language(&text);
                            if source_lang == Language::Unknown {
                                eprintln!("Unknown language, skipping");
                                continue;
                            }

                            // Provider: local Bonsai model (sidecar) or cloud Gemini API
                            let use_local = { get_bonsai_state().lock().unwrap().enabled };

                            let result = if use_local {
                                bonsai::translate(&text, source_lang).await
                            } else {
                                // Get Gemini API key
                                let api_key = match keyring::Entry::new("streaid", "gemini_api_key")
                                    .get_password()
                                {
                                    Ok(key) => key,
                                    Err(_) => {
                                        eprintln!("No Gemini API key configured");
                                        continue;
                                    }
                                };

                                translate_text(&text, &api_key, source_lang).await
                            };

                            match result {
                                Ok(result) => {
                                    eprintln!("Translation suggestions: {:?}", result.suggestions);

                                    // Send each suggestion as a separate chat message (without points)
                                    for (idx, suggestion) in result.suggestions.iter().enumerate() {
                                        let mut response = format!(
                                            "@{}: [{}/{}] [{}] {}",
                                            irc_msg.username,
                                            idx + 1,
                                            result.suggestions.len(),
                                            suggestion.formality,
                                            suggestion.text
                                        );

                                        // Handle Twitch's 500 character limit
                                        if response.len() > 490 {
                                            let max_text_len = 400 - irc_msg.username.len();
                                            let truncated_text = if suggestion.text.len()
                                                > max_text_len
                                            {
                                                format!(
                                                    "{}...",
                                                    truncate_utf8(&suggestion.text, max_text_len)
                                                )
                                            } else {
                                                suggestion.text.clone()
                                            };

                                            response = format!(
                                                "@{}: [{}/{}] [{}] {}",
                                                irc_msg.username,
                                                idx + 1,
                                                result.suggestions.len(),
                                                suggestion.formality,
                                                truncated_text
                                            );
                                        }

                                        // Send message
                                        if let Err(e) =
                                            send_chat_message(&mut ws_stream, &channel, &response)
                                                .await
                                        {
                                            eprintln!(
                                                "Failed to send message {}/{}: {}",
                                                idx + 1,
                                                result.suggestions.len(),
                                                e
                                            );
                                            // Continue sending other messages even if one fails
                                        } else {
                                            eprintln!(
                                                "Sent suggestion {}/{} to chat",
                                                idx + 1,
                                                result.suggestions.len()
                                            );
                                        }

                                        // Add delay between messages to avoid Twitch rate limiting
                                        tokio::time::sleep(tokio::time::Duration::from_millis(500))
                                            .await;
                                    }

                                    // Send linguistic points as a separate message (4th message)
                                    let points_str = result.points.join(", ");
                                    let points_message = format!(
                                        "@{}: 翻訳の根拠: {}",
                                        irc_msg.username, points_str
                                    );

                                    // Handle truncation for points message
                                    let final_points_message = if points_message.len() > 490 {
                                        let max_len = 490 - irc_msg.username.len() - 20;
                                        format!(
                                            "@{}: 翻訳の根拠: {}...",
                                            irc_msg.username,
                                            truncate_utf8(&points_str, max_len)
                                        )
                                    } else {
                                        points_message
                                    };

                                    if let Err(e) = send_chat_message(
                                        &mut ws_stream,
                                        &channel,
                                        &final_points_message,
                                    )
                                    .await
                                    {
                                        eprintln!("Failed to send points message: {}", e);
                                    } else {
                                        eprintln!("Sent linguistic points to chat");
                                    }

                                    eprintln!(
                                        "All {} suggestions + points sent to chat",
                                        result.suggestions.len()
                                    );

                                    // Emit event to frontend
                                    let target_lang = match source_lang {
                                        Language::Japanese => "English",
                                        Language::English => "Japanese",
                                        Language::Unknown => "Unknown",
                                    };

                                    let event = TranslationEvent {
                                        original_user: irc_msg.username.clone(),
                                        original_message: text.clone(),
                                        suggestions: result.suggestions.clone(),
                                        points: result.points.clone(),
                                        timestamp: chrono::Utc::now().to_rfc3339(),
                                        source_lang: source_lang.to_string(),
                                        target_lang: target_lang.to_string(),
                                    };

                                    if let Err(e) = app.emit("translation", &event) {
                                        eprintln!("Failed to emit translation event: {}", e);
                                    }
                                    let _ = overlay::OVERLAY_TX.send(overlay::OverlayMessage {
                                        event_type: "translation".to_string(),
                                        data: serde_json::to_value(&event).unwrap_or_default(),
                                    });
                                }
                                Err(e) => {
                                    eprintln!("Translation failed: {}", e);
                                }
                            }
                        }
                    }
                    // Check for !d command
                    else if is_dictionary_command(&irc_msg.message) {
                        if let Some(word) = extract_dictionary_word(&irc_msg.message) {
                            eprintln!("Dictionary request: {}", word);

                            // Detect language
                            let source_lang = detect_language(&word);
                            if source_lang == Language::Unknown {
                                eprintln!("Unknown language, skipping");
                                continue;
                            }

                            // Provider: local Bonsai model (sidecar) or cloud Gemini API
                            let use_local = { get_bonsai_state().lock().unwrap().enabled };

                            let result = if use_local {
                                bonsai::lookup_word(&word, source_lang).await
                            } else {
                                // Get Gemini API key (same as translation)
                                let api_key = match keyring::Entry::new("streaid", "gemini_api_key")
                                    .get_password()
                                {
                                    Ok(key) => key,
                                    Err(_) => {
                                        eprintln!("No Gemini API key configured");
                                        continue;
                                    }
                                };

                                lookup_word(&word, &api_key, source_lang).await
                            };

                            // Lookup word
                            match result {
                                Ok(result) => {
                                    eprintln!("Dictionary result: {:?}", result);

                                    // Send meaning message
                                    let meaning_msg = format!(
                                        "@{}: [Dict] {} - {}",
                                        irc_msg.username, result.word, result.meaning
                                    );

                                    let truncated_meaning = if meaning_msg.len() > 490 {
                                        let max_len = 470 - irc_msg.username.len();
                                        format!(
                                            "@{}: [Dict] {} - {}...",
                                            irc_msg.username,
                                            result.word,
                                            truncate_utf8(&result.meaning, max_len)
                                        )
                                    } else {
                                        meaning_msg
                                    };

                                    if let Err(e) = send_chat_message(
                                        &mut ws_stream,
                                        &channel,
                                        &truncated_meaning,
                                    )
                                    .await
                                    {
                                        eprintln!("Failed to send meaning: {}", e);
                                    } else {
                                        eprintln!("Sent meaning to chat");
                                    }

                                    tokio::time::sleep(tokio::time::Duration::from_millis(500))
                                        .await;

                                    // Send examples message
                                    let examples_str = result.examples.join(" | ");
                                    let examples_msg = format!(
                                        "@{}: [Examples] {}",
                                        irc_msg.username, examples_str
                                    );

                                    let truncated_examples = if examples_msg.len() > 490 {
                                        let max_len = 460 - irc_msg.username.len();
                                        format!(
                                            "@{}: [Examples] {}...",
                                            irc_msg.username,
                                            truncate_utf8(&examples_str, max_len)
                                        )
                                    } else {
                                        examples_msg
                                    };

                                    if let Err(e) = send_chat_message(
                                        &mut ws_stream,
                                        &channel,
                                        &truncated_examples,
                                    )
                                    .await
                                    {
                                        eprintln!("Failed to send examples: {}", e);
                                    } else {
                                        eprintln!("Sent examples to chat");
                                    }

                                    tokio::time::sleep(tokio::time::Duration::from_millis(500))
                                        .await;

                                    // Send synonyms message
                                    let similar_str = result.similar_words.join(", ");
                                    let similar_msg = format!(
                                        "@{}: [Synonyms] {}",
                                        irc_msg.username, similar_str
                                    );

                                    let truncated_similar = if similar_msg.len() > 490 {
                                        let max_len = 460 - irc_msg.username.len();
                                        format!(
                                            "@{}: [Synonyms] {}...",
                                            irc_msg.username,
                                            truncate_utf8(&similar_str, max_len)
                                        )
                                    } else {
                                        similar_msg
                                    };

                                    if let Err(e) = send_chat_message(
                                        &mut ws_stream,
                                        &channel,
                                        &truncated_similar,
                                    )
                                    .await
                                    {
                                        eprintln!("Failed to send similar words: {}", e);
                                    } else {
                                        eprintln!("Sent similar words to chat");
                                    }

                                    // Emit event to frontend
                                    let target_lang = match source_lang {
                                        Language::Japanese => "English",
                                        Language::English => "Japanese",
                                        Language::Unknown => "Unknown",
                                    };

                                    let event = DictionaryEvent {
                                        original_user: irc_msg.username.clone(),
                                        original_word: word.clone(),
                                        word: result.word.clone(),
                                        meaning: result.meaning.clone(),
                                        examples: result.examples.clone(),
                                        similar_words: result.similar_words.clone(),
                                        timestamp: chrono::Utc::now().to_rfc3339(),
                                        source_lang: source_lang.to_string(),
                                        target_lang: target_lang.to_string(),
                                    };

                                    if let Err(e) = app.emit("dictionary", &event) {
                                        eprintln!("Failed to emit dictionary event: {}", e);
                                    }
                                    let _ = overlay::OVERLAY_TX.send(overlay::OverlayMessage {
                                        event_type: "dictionary".to_string(),
                                        data: serde_json::to_value(&event).unwrap_or_default(),
                                    });
                                }
                                Err(e) => {
                                    eprintln!("Dictionary lookup failed: {}", e);
                                }
                            }
                        }
                    }
                }
            }
            Some(Err(e)) => {
                eprintln!("WebSocket error: {}", e);
                break;
            }
            None => {
                eprintln!("WebSocket closed");
                break;
            }
            _ => {
                // Ignore other message types (Binary, Ping, Pong, Close, Frame)
                continue;
            }
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            // Start the OBS overlay HTTP server
            async_runtime::spawn(overlay::start_overlay_server(
                4242,
                overlay::OVERLAY_TX.clone(),
            ));

            // spawn a background task using Tauri's async runtime to periodically refresh tokens
            let state = get_auth_state();
            async_runtime::spawn(async move {
                loop {
                    // check if token needs refresh within next 60 seconds
                    if let Ok(Some(_info)) = auth::refresh_token_if_needed(state.clone(), 60).await
                    {
                        // refreshed successfully — could log or notify
                    }
                    // Sleep for 30 seconds between checks
                    sleep(Duration::from_secs(30)).await;
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            start_device_flow_cmd,
            poll_device_flow_cmd,
            get_stored_token_cmd,
            clear_stored_token_cmd,
            refresh_token_cmd,
            open_url_cmd,
            debug_token_status,
            set_client_id_cmd,
            get_client_id_cmd,
            set_gemini_api_key_cmd,
            get_gemini_api_key_cmd,
            start_chat_listener_cmd,
            stop_chat_listener_cmd,
            get_chat_status_cmd,
            toggle_translation_cmd,
            set_sound_cmd,
            get_sound_cmd,
            clear_sound_cmd,
            get_overlay_url_cmd,
            set_local_model_cmd,
            get_bonsai_status_cmd,
            test_translation_cmd,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            // Kill the local model sidecar when the app exits
            if let tauri::RunEvent::Exit = event {
                stop_bonsai();
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_lowercase() {
        assert_eq!(sanitize_channel_name("MyChannel").unwrap(), "mychannel");
    }

    #[test]
    fn test_sanitize_strip_hash() {
        assert_eq!(sanitize_channel_name("#streamer").unwrap(), "streamer");
    }

    #[test]
    fn test_sanitize_empty_after_hash() {
        assert_eq!(sanitize_channel_name("#").unwrap(), "");
    }

    #[test]
    fn test_sanitize_spaces_err() {
        assert!(sanitize_channel_name("my channel").is_err());
    }

    #[test]
    fn test_sanitize_too_long_err() {
        assert!(sanitize_channel_name(&"a".repeat(26)).is_err());
    }

    #[test]
    fn test_sanitize_special_chars_err() {
        assert!(sanitize_channel_name("chan!nel").is_err());
    }

    #[test]
    fn test_sanitize_underscores_ok() {
        assert_eq!(
            sanitize_channel_name("my_channel_1").unwrap(),
            "my_channel_1"
        );
    }

    #[test]
    fn test_truncate_ascii_within() {
        assert_eq!(truncate_utf8("hello", 10), "hello");
    }

    #[test]
    fn test_truncate_ascii_at_limit() {
        assert_eq!(truncate_utf8("hello world", 5), "hello");
    }

    #[test]
    fn test_truncate_japanese_safe() {
        let s = "こんにちは"; // 15 bytes; truncate at 10
        let t = truncate_utf8(s, 10);
        assert!(s.is_char_boundary(t.len()));
        assert!(t.len() <= 10);
    }

    #[test]
    fn test_truncate_mixed() {
        let s = "hello こんにちは";
        let t = truncate_utf8(s, 8);
        assert!(s.is_char_boundary(t.len()));
        assert!(t.len() <= 8);
    }

    #[test]
    fn test_truncate_empty() {
        assert_eq!(truncate_utf8("", 10), "");
    }
}
