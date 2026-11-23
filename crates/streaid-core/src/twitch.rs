//! Minimal read-only Twitch Helix client.
//!
//! Uses the existing device-flow token and Client ID. No additional scopes
//! are requested: these endpoints only need a user token with `chat:read`.

use anyhow::{bail, Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

const HELIX: &str = "https://api.twitch.tv/helix";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TwitchUser {
    pub id: String,
    pub login: String,
    pub display_name: String,
    #[serde(default)]
    pub profile_image_url: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub broadcaster_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TwitchChannel {
    pub broadcaster_id: String,
    #[serde(default)]
    pub game_name: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TwitchClip {
    pub id: String,
    pub url: String,
    #[serde(default)]
    pub embed_url: String,
    #[serde(default)]
    pub thumbnail_url: String,
    #[serde(default)]
    pub broadcaster_name: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub view_count: u64,
}

#[derive(Deserialize)]
struct DataResponse<T> {
    data: Vec<T>,
}

fn credentials() -> Result<(String, String)> {
    let client_id = crate::auth::load_client_id()
        .context("reading Twitch Client ID")?
        .context("Twitch Client ID is not configured")?;
    let token = crate::auth::stored_token()
        .context("reading stored Twitch token")?
        .context("Twitch authentication is missing")?;
    Ok((client_id, token.access_token))
}

fn client() -> Result<Client> {
    Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .context("building Twitch HTTP client")
}

async fn get_json<T: for<'de> Deserialize<'de>>(
    path: &str,
    query: &[(&str, &str)],
) -> Result<Option<T>> {
    let (client_id, token) = credentials()?;
    let response = client()?
        .get(format!("{}{}", HELIX, path))
        .query(query)
        .header("Client-Id", client_id)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .context("calling Twitch Helix")?;

    let status = response.status();
    let body = response.text().await.context("reading Twitch response")?;
    if !status.is_success() {
        bail!("Twitch API error ({}): {}", status, body);
    }

    let parsed: DataResponse<T> = serde_json::from_str(&body).context("parsing Twitch response")?;
    Ok(parsed.data.into_iter().next())
}

/// Look up a user by login name (case-insensitive on Twitch).
pub async fn get_user(login: &str) -> Result<Option<TwitchUser>> {
    get_json("/users", &[("login", login)]).await
}

/// Get channel information (category/title/language) for a broadcaster.
pub async fn get_channel(broadcaster_id: &str) -> Result<Option<TwitchChannel>> {
    get_json("/channels", &[("broadcaster_id", broadcaster_id)]).await
}

/// Get the latest clip for a broadcaster.
pub async fn latest_clip(broadcaster_id: &str) -> Result<Option<TwitchClip>> {
    get_json(
        "/clips",
        &[("broadcaster_id", broadcaster_id), ("first", "1")],
    )
    .await
}
