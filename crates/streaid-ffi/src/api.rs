//! JSON API surface shared by all native frontends (SwiftUI today).
//!
//! Every method takes a JSON object and returns `{"ok":true,"result":...}`
//! or `{"ok":false,"error":"..."}`. The wire format is intentionally small
//! and stable: it is the contract between the Rust core and platform UIs.

use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use streaid_core as core;

/// Dispatch a raw JSON request. Never panics: errors are returned as JSON.
pub fn dispatch_json(req: &str) -> String {
    let value: Value = match serde_json::from_str(req) {
        Ok(v) => v,
        Err(e) => return error(format!("invalid json: {e}")),
    };
    let method = value
        .get("method")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let params = value
        .get("params")
        .cloned()
        .unwrap_or_else(|| Value::Object(Default::default()));

    match dispatch(method, &params) {
        Ok(result) => json!({ "ok": true, "result": result }).to_string(),
        Err(e) => error(e),
    }
}

/// Poll pending events (same payload as `streaid_poll_events`).
pub fn poll_events_json() -> String {
    match dispatch("events.poll", &Value::Null) {
        Ok(result) => json!({ "ok": true, "result": result }).to_string(),
        Err(e) => error(e),
    }
}

fn error(message: impl Into<String>) -> String {
    json!({ "ok": false, "error": message.into() }).to_string()
}

fn ensure_runtime() -> Result<(), String> {
    if core::is_runtime_initialized() {
        Ok(())
    } else {
        Err("core not initialized; call streaid_init() first".to_string())
    }
}

fn param<T: DeserializeOwned>(params: &Value, key: &str) -> Result<T, String> {
    let value = params
        .get(key)
        .ok_or_else(|| format!("missing parameter: {key}"))?;
    serde_json::from_value(value.clone()).map_err(|e| format!("invalid parameter {key}: {e}"))
}

fn optional<T: DeserializeOwned>(params: &Value, key: &str) -> Result<Option<T>, String> {
    match params.get(key) {
        None | Some(Value::Null) => Ok(None),
        Some(value) => serde_json::from_value(value.clone())
            .map(Some)
            .map_err(|e| format!("invalid parameter {key}: {e}")),
    }
}

fn dispatch(method: &str, params: &Value) -> Result<Value, String> {
    match method {
        // ── system ───────────────────────────────────────────────────────
        "system.capabilities" => Ok(json!({
            "api_version": 1,
            "os": core::platform::OS,
            "platform": core::platform::label(),
            "local_model_supported": core::platform::local_model_supported(),
            "app_data_dir": core::app_data_dir().to_string_lossy(),
            "overlay_url": "http://localhost:4242",
        })),
        "system.app_data_dir" => Ok(json!(core::app_data_dir().to_string_lossy())),
        "system.overlay_url" => Ok(json!("http://localhost:4242")),
        "system.shutdown" => {
            core::shutdown();
            Ok(Value::Null)
        }

        // ── events ───────────────────────────────────────────────────────
        "events.poll" | "system.drain_events" => Ok(json!(core::drain_events())),

        // ── auth ─────────────────────────────────────────────────────────
        "auth.status" => match core::auth::stored_token_status() {
            Ok(has_token) => Ok(json!({ "has_token": has_token, "error": null })),
            Err(error) => Ok(json!({ "has_token": false, "error": error.to_string() })),
        },
        "auth.has_token" => Ok(json!(core::auth::has_stored_token())),
        "auth.stored_token" => core::auth::stored_token()
            .map(|t| json!(t))
            .map_err(|e| e.to_string()),
        "auth.save_client_id" => {
            let client_id: String = param(params, "client_id")?;
            core::auth::save_client_id(&client_id)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "auth.load_client_id" => core::auth::load_client_id()
            .map(|id| json!(id))
            .map_err(|e| e.to_string()),
        "auth.start_device_flow" => {
            ensure_runtime()?;
            let client_id: String = param(params, "client_id")?;
            core::block_on(core::auth::start_device_flow_default(&client_id))
                .map(|info| json!(info))
                .map_err(|e| e.to_string())
        }
        "auth.device_flow_interval" => Ok(json!(core::auth::device_flow_interval())),
        "auth.poll_device_flow" => {
            ensure_runtime()?;
            core::block_on(core::auth::poll_device_flow_default())
                .map(|token| json!(token))
                .map_err(|e| e.to_string())
        }
        "auth.clear" => core::auth::clear_stored_token()
            .map(|_| Value::Null)
            .map_err(|e| e.to_string()),

        // ── settings ────────────────────────────────────────────────────
        "settings.get" => Ok(json!(core::store::load_settings())),
        "settings.set" => {
            let settings: core::store::Settings = serde_json::from_value(params.clone())
                .map_err(|e| format!("invalid settings: {e}"))?;
            core::store::save_settings(&settings)
                .map(|_| json!(settings))
                .map_err(|e| e.to_string())
        }

        // ── shoutout ─────────────────────────────────────────────────────
        "shoutout.run" => {
            ensure_runtime()?;
            let username: String = param(params, "username")?;
            let mode = match optional::<String>(params, "mode")?.as_deref() {
                Some("info") => Some(core::shoutout::ShoutoutMode::Info),
                Some("clip") => Some(core::shoutout::ShoutoutMode::Clip),
                _ => None,
            };
            let message = core::block_on(core::shoutout::run(&username, mode))?;
            core::block_on(core::send_chat_message(&message))?;
            Ok(json!(message))
        }
        "shoutout.stop" => {
            core::shoutout::stop_clip();
            Ok(Value::Null)
        }

        // ── raiders ──────────────────────────────────────────────────────
        "raiders.list" => Ok(json!(core::store::list_raiders())),
        "raiders.delete" => {
            let id: String = param(params, "id")?;
            core::store::delete_raider(&id)
                .map(|records| json!(records))
                .map_err(|e| e.to_string())
        }

        // ── commands ─────────────────────────────────────────────────────
        "commands.list" => Ok(json!(core::store::list_commands())),
        "commands.save" => {
            let record: core::store::CommandRecord = serde_json::from_value(params.clone())
                .map_err(|e| format!("invalid command: {e}"))?;
            let name = core::commands::validate_custom(&record.command, &record.body)?;
            let mut record = record;
            record.command = name;
            core::store::save_command(record)
                .map(|records| json!(records))
                .map_err(|e| e.to_string())
        }
        "commands.delete" => {
            let id: String = param(params, "id")?;
            core::store::delete_command(&id)
                .map(|records| json!(records))
                .map_err(|e| e.to_string())
        }

        // ── memos ────────────────────────────────────────────────────────
        "memos.list" => Ok(json!(core::store::list_memos())),
        "memos.save" => {
            let record: core::store::MemoRecord =
                serde_json::from_value(params.clone()).map_err(|e| format!("invalid memo: {e}"))?;
            if record.username.trim().is_empty() {
                return Err("username is required".to_string());
            }
            core::store::save_memo(record)
                .map(|records| json!(records))
                .map_err(|e| e.to_string())
        }
        "memos.delete" => {
            let id: String = param(params, "id")?;
            core::store::delete_memo(&id)
                .map(|records| json!(records))
                .map_err(|e| e.to_string())
        }

        // ── gemini ───────────────────────────────────────────────────────
        "gemini.set_key" => {
            let key: String = param(params, "key")?;
            core::set_gemini_api_key(&key).map(|_| Value::Null)
        }
        "gemini.key_masked" => Ok(json!(core::get_gemini_api_key_masked())),
        "gemini.has_key" => Ok(json!(core::has_gemini_api_key())),

        // ── chat listener ────────────────────────────────────────────────
        "chat.status" => Ok(json!(core::get_chat_status())),
        "chat.start" => {
            ensure_runtime()?;
            let channel: Option<String> = optional(params, "channel")?;
            core::block_on(core::start_chat_listener(channel)).map(|_| Value::Null)
        }
        "chat.stop" => core::stop_chat_listener().map(|_| Value::Null),
        "chat.last_channel" => core::load_last_channel()
            .map(|channel| json!(channel))
            .map_err(|e| e.to_string()),
        "chat.remember_channel" => {
            let channel: String = param(params, "channel")?;
            core::save_last_channel(&channel).map(|_| Value::Null)
        }
        "chat.toggle" => {
            let enabled: bool = param(params, "enabled")?;
            core::toggle_translation(enabled).map(|_| Value::Null)
        }

        // ── local model ──────────────────────────────────────────────────
        "model.set_variant" => {
            let model: String = param(params, "model")?;
            core::set_local_model_variant(&model).map(|_| Value::Null)
        }
        "model.set_enabled" => {
            ensure_runtime()?;
            let enabled: bool = param(params, "enabled")?;
            core::block_on(core::set_local_model(enabled)).map(|_| Value::Null)
        }
        "model.status" => {
            ensure_runtime()?;
            core::block_on(core::get_bonsai_status()).map(|status| json!(status))
        }
        "model.test" => {
            ensure_runtime()?;
            let text: String = param(params, "text")?;
            let provider: String = param(params, "provider")?;
            let mode: String = param(params, "mode")?;
            core::block_on(core::test_model(text, provider, mode)).map(|result| json!(result))
        }

        // ── sounds ───────────────────────────────────────────────────────
        "sounds.save" => {
            use base64::Engine as _;
            let slot: String = param(params, "slot")?;
            let file_name: String = param(params, "file_name")?;
            let data_b64: String = param(params, "data_b64")?;
            let data = base64::engine::general_purpose::STANDARD
                .decode(data_b64)
                .map_err(|e| format!("invalid base64: {e}"))?;
            core::sounds::save_sound(&slot, &data, &file_name)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "sounds.get" => {
            let slot: String = param(params, "slot")?;
            core::sounds::get_sound(&slot)
                .map(|sound| json!(sound))
                .map_err(|e| e.to_string())
        }
        "sounds.delete" => {
            let slot: String = param(params, "slot")?;
            core::sounds::delete_sound(&slot)
                .map(|_| Value::Null)
                .map_err(|e| e.to_string())
        }
        "sounds.play" => {
            let path: String = param(params, "path")?;
            let volume: f32 = optional(params, "volume")?.unwrap_or(1.0);
            core::play_sound_file(path.into(), volume);
            Ok(Value::Null)
        }

        // ── vocabulary ───────────────────────────────────────────────────
        "vocab.summary" => Ok(json!(core::vocabulary::summary())),
        "vocab.top" => {
            let n: usize = optional(params, "n")?.unwrap_or(20);
            Ok(json!(core::vocabulary::top_words(n)))
        }
        "vocab.clear" => {
            core::vocabulary::clear();
            Ok(Value::Null)
        }
        "vocab.analyze" => {
            ensure_runtime()?;
            core::block_on(core::vocabulary::analyze_categories()).map(|r| json!(r))
        }

        // ── overlay ──────────────────────────────────────────────────────
        "overlay.session_lookups" => Ok(json!(core::session_lookups())),

        other => Err(format!("unknown method: {other}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn capabilities_are_reported() {
        let response: Value =
            serde_json::from_str(&dispatch_json(r#"{"method":"system.capabilities"}"#)).unwrap();
        assert_eq!(response["ok"], true);
        assert_eq!(response["result"]["os"], std::env::consts::OS);
        assert_eq!(response["result"]["api_version"], 1);
        assert!(response["result"]["overlay_url"]
            .as_str()
            .unwrap()
            .contains("4242"));
    }

    #[test]
    fn unknown_method_returns_error() {
        let response: Value = serde_json::from_str(&dispatch_json(r#"{"method":"nope"}"#)).unwrap();
        assert_eq!(response["ok"], false);
        assert!(response["error"]
            .as_str()
            .unwrap()
            .contains("unknown method"));
    }

    #[test]
    fn invalid_json_returns_error() {
        let response: Value = serde_json::from_str(&dispatch_json("{")).unwrap();
        assert_eq!(response["ok"], false);
    }

    #[test]
    fn missing_parameter_returns_error() {
        let response: Value =
            serde_json::from_str(&dispatch_json(r#"{"method":"gemini.set_key","params":{}}"#))
                .unwrap();
        assert_eq!(response["ok"], false);
        assert!(response["error"]
            .as_str()
            .unwrap()
            .contains("missing parameter"));
    }

    #[test]
    fn documented_methods_are_routable() {
        // Non-destructive methods only: no keychain writes, no vocabulary
        // clearing, no listener start. They may fail with missing parameters
        // or an uninitialized runtime, but must never be "unknown method".
        const METHODS: &[&str] = &[
            "system.capabilities",
            "system.app_data_dir",
            "system.overlay_url",
            "system.drain_events",
            "events.poll",
            "auth.start_device_flow",
            "auth.poll_device_flow",
            "gemini.set_key",
            "settings.get",
            "raiders.list",
            "commands.list",
            "memos.list",
            "chat.status",
            "chat.start",
            "model.status",
            "model.set_enabled",
            "model.test",
            "sounds.get",
            "sounds.play",
            "vocab.summary",
            "vocab.top",
            "overlay.session_lookups",
        ];

        for method in METHODS {
            let request = format!(r#"{{"method":"{method}"}}"#);
            let response: Value = serde_json::from_str(&dispatch_json(&request)).unwrap();
            if let Some(error) = response["error"].as_str() {
                assert!(
                    !error.contains("unknown method"),
                    "{method} is not routed: {error}"
                );
            }
        }
    }

    #[test]
    fn events_poll_is_empty_before_init() {
        let response: Value =
            serde_json::from_str(&dispatch_json(r#"{"method":"events.poll"}"#)).unwrap();
        assert_eq!(response["ok"], true);
        assert_eq!(response["result"], json!([]));
    }
}
