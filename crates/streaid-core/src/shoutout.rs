//! Shoutout messages and alert overlay events.

use crate::overlay::{OverlayMessage, OVERLAY_TX};
use crate::store;
use crate::twitch;
use serde_json::json;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ShoutoutMode {
    Info,
    Clip,
}

fn replace_vars(template: &str, display_name: &str, login: &str, category: &str) -> String {
    template
        .replace("%username%", display_name)
        .replace("%user_id%", login)
        .replace("%url%", &format!("https://www.twitch.tv/{}", login))
        .replace("%category%", category)
}

fn send_overlay(event_type: &str, data: serde_json::Value) {
    let _ = OVERLAY_TX.send(OverlayMessage {
        event_type: event_type.to_string(),
        data,
    });
}

/// Build the chat message and (optionally) trigger the info/clip alert.
pub async fn run(username: &str, mode: Option<ShoutoutMode>) -> Result<String, String> {
    let settings = store::load_settings();

    let user = twitch::get_user(username)
        .await
        .map_err(|e| format!("Twitch lookup failed: {}", e))?;
    let Some(user) = user else {
        return Ok(settings
            .shoutout_not_found
            .replace("%user_id%", username)
            .replace("%username%", username)
            .replace("%url%", &format!("https://www.twitch.tv/{}", username))
            .replace("%category%", ""));
    };

    let channel = twitch::get_channel(&user.id)
        .await
        .map_err(|e| format!("Twitch channel lookup failed: {}", e))?;
    let Some(channel) = channel else {
        let message = settings
            .shoutout_failed
            .replace("%username%", &user.display_name)
            .replace("%user_id%", &user.login)
            .replace("%url%", &format!("https://www.twitch.tv/{}", user.login))
            .replace("%category%", "");
        return Ok(message);
    };

    let message = replace_vars(
        &settings.shoutout_message,
        &user.display_name,
        &user.login,
        &channel.game_name,
    );

    match mode {
        Some(ShoutoutMode::Info) => {
            send_overlay(
                "info",
                json!({
                    "login": user.login,
                    "display_name": user.display_name,
                    "profile_image_url": user.profile_image_url,
                    "category": channel.game_name,
                    "duration": settings.shoutout_info_length,
                }),
            );
        }
        Some(ShoutoutMode::Clip) => {
            if let Ok(Some(clip)) = twitch::latest_clip(&user.id).await {
                send_overlay(
                    "clip",
                    json!({
                        "embed_url": clip.embed_url,
                        "thumbnail_url": clip.thumbnail_url,
                        "display_name": user.display_name,
                        "url": clip.url,
                    }),
                );
            }
        }
        None => {}
    }

    Ok(message)
}

/// Stop the currently-playing clip alert.
pub fn stop_clip() {
    send_overlay("clip:stop", json!({}));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn replaces_message_variables() {
        let message = replace_vars(
            "Check %username% (%user_id%) at %url% - last played %category%",
            "Display Name",
            "login_name",
            "Just Chatting",
        );
        assert_eq!(
            message,
            "Check Display Name (login_name) at https://www.twitch.tv/login_name - last played Just Chatting"
        );
    }

    #[test]
    fn info_duration_default_is_sane() {
        let settings = store::Settings::default();
        assert!((0..=60).contains(&settings.shoutout_info_length));
    }
}
