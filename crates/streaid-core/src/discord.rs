//! Discord webhook notifications for dictionary lookups.

use anyhow::{bail, Context, Result};
use reqwest::Client;
use serde_json::json;
use std::time::Duration;

pub async fn post_lookup(
    webhook: &str,
    user: &str,
    word: &str,
    meaning: &str,
    examples: &[String],
    source_lang: &str,
    target_lang: &str,
) -> Result<()> {
    let description: String = meaning.chars().take(3500).collect();
    let mut fields = Vec::new();
    if !examples.is_empty() {
        let examples_text: String = examples.join(" / ").chars().take(1000).collect();
        fields.push(json!({
            "name": "Examples",
            "value": examples_text,
            "inline": false,
        }));
    }

    let payload = json!({
        "embeds": [{
            "title": word,
            "description": description,
            "color": 0x9146FF,
            "fields": fields,
            "footer": {
                "text": format!("requested by @{} · {} → {}", user, source_lang, target_lang)
            }
        }]
    });

    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .context("building Discord HTTP client")?;
    let response = client
        .post(webhook)
        .json(&payload)
        .send()
        .await
        .context("posting Discord webhook")?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        bail!("Discord webhook error ({}): {}", status, body);
    }
    Ok(())
}
