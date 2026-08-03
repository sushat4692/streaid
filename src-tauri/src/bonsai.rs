//! Local model provider (Bonsai / llama-server sidecar).
//!
//! Talks to a locally running `llama-server` (OpenAI-compatible API) instead
//! of the cloud Gemini API. The same prompts and JSON schemas as the Gemini
//! provider are reused; output is constrained via `response_format: json_schema`
//! (llama.cpp grammar-based structured generation).

use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::dictionary::{build_dictionary_prompt, dictionary_schema, DictionaryResult};
use crate::translate::{build_translation_prompt, translation_schema, Language, TranslationResult};

/// Base URL of the local llama-server (started as a sidecar by `set_local_model_cmd`).
/// Port 4243 (adjacent to the overlay's 4242) to avoid conflicts with other
/// local services that commonly use 8080.
pub const SERVER_URL: &str = "http://127.0.0.1:4243";

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    response_format: ResponseFormat,
}

#[derive(Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ResponseFormat {
    r#type: String,
    json_schema: JsonSchema,
}

#[derive(Serialize)]
struct JsonSchema {
    name: String,
    schema: serde_json::Value,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatResponseMessage,
}

#[derive(Deserialize)]
struct ChatResponseMessage {
    content: String,
}

/// Returns true when the local llama-server is up and accepting requests.
pub async fn server_ready() -> bool {
    let client = Client::new();
    client
        .get(format!("{}/health", SERVER_URL))
        .timeout(Duration::from_secs(2))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

/// Translate text using the local model. Mirrors `translate::translate_text`'s contract.
pub async fn translate(text: &str, from_lang: Language) -> Result<TranslationResult> {
    if from_lang == Language::Unknown {
        anyhow::bail!("Cannot translate unknown language");
    }

    let target_lang = match from_lang {
        Language::Japanese => "English",
        Language::English => "Japanese",
        Language::Unknown => unreachable!(),
    };

    let prompt = build_translation_prompt(text, from_lang, target_lang);
    eprintln!(
        "[bonsai] Translating {} -> {}: {}",
        from_lang, target_lang, text
    );

    let json_text = call_json_chat("translate", &prompt, translation_schema()).await?;

    let result: TranslationResult = serde_json::from_str(&json_text)
        .context("Failed to parse local translation result JSON")?;

    if result.suggestions.is_empty() {
        anyhow::bail!("No translation suggestions returned");
    }

    eprintln!(
        "[bonsai] Translation suggestions: {} (points: {})",
        result.suggestions.len(),
        result.points.len()
    );

    Ok(result)
}

/// Look up a word using the local model. Mirrors `dictionary::lookup_word`'s contract.
pub async fn lookup_word(word: &str, from_lang: Language) -> Result<DictionaryResult> {
    if from_lang == Language::Unknown {
        anyhow::bail!("Cannot lookup unknown language");
    }

    let target_lang = match from_lang {
        Language::Japanese => "English",
        Language::English => "Japanese",
        Language::Unknown => unreachable!(),
    };

    let prompt = build_dictionary_prompt(word, from_lang, target_lang);
    eprintln!("[bonsai] Looking up {} word: {}", from_lang, word);

    let json_text = call_json_chat("dictionary", &prompt, dictionary_schema()).await?;

    let result: DictionaryResult =
        serde_json::from_str(&json_text).context("Failed to parse local dictionary result JSON")?;

    eprintln!(
        "[bonsai] Dictionary result: {} - {}",
        result.word, result.meaning
    );

    Ok(result)
}

/// POST a single-turn chat request with JSON-schema-constrained output and
/// return the raw JSON text from the response.
async fn call_json_chat(
    name: &str,
    system_prompt: &str,
    schema: serde_json::Value,
) -> Result<String> {
    let body = ChatRequest {
        model: "bonsai".to_string(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: "Now provide the JSON response following the exact format above."
                    .to_string(),
            },
        ],
        temperature: 0.7,
        response_format: ResponseFormat {
            r#type: "json_schema".to_string(),
            json_schema: JsonSchema {
                name: name.to_string(),
                schema,
            },
        },
    };

    let client = Client::new();
    let response = client
        .post(format!("{}/v1/chat/completions", SERVER_URL))
        .json(&body)
        .send()
        .await
        .context("Failed to reach local llama-server (is the local model enabled and running?)")?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        anyhow::bail!("llama-server error ({}): {}", status, error_text);
    }

    let chat: ChatResponse = response
        .json()
        .await
        .context("Failed to parse llama-server response")?;

    chat.choices
        .into_iter()
        .next()
        .map(|c| c.message.content.trim().to_string())
        .filter(|s| !s.is_empty())
        .ok_or_else(|| anyhow::anyhow!("No response from local model"))
}
