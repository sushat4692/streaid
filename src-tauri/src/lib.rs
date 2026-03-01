// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod auth;
use auth::{
    poll_device_flow, shared_state, start_device_flow, DeviceCodeInfo, InnerState, TokenInfo,
};
use once_cell::sync::Lazy;
use std::sync::Arc;
use std::time::Duration;
use tauri::async_runtime;
use tokio::time::sleep;

static AUTH_STATE: Lazy<Arc<std::sync::Mutex<InnerState>>> = Lazy::new(|| shared_state());

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Shared state for auth

fn get_auth_state() -> std::sync::Arc<std::sync::Mutex<InnerState>> {
    AUTH_STATE.clone()
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
            "chat_read" => Some(twitch_oauth2::Scope::ChatRead),
            "chat_edit" => Some(twitch_oauth2::Scope::ChatEdit),
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
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
            get_client_id_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
