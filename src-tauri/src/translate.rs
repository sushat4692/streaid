use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Language {
    Japanese,
    English,
    Unknown,
}

impl std::fmt::Display for Language {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Language::Japanese => write!(f, "Japanese"),
            Language::English => write!(f, "English"),
            Language::Unknown => write!(f, "Unknown"),
        }
    }
}

/// Translation suggestion with formality level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationSuggestion {
    pub text: String,
    pub formality: String, // "casual", "neutral", "formal"
}

/// Multiple translation suggestions with linguistic reasoning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationResult {
    pub suggestions: Vec<TranslationSuggestion>,
    pub points: Vec<String>, // Linguistic reasoning for translation choices
}

#[derive(Serialize)]
struct GeminiRequest {
    contents: Vec<Content>,
    generation_config: GenerationConfig,
}

#[derive(Serialize)]
struct GenerationConfig {
    response_mime_type: String,
    response_schema: ResponseSchema,
}

#[derive(Serialize)]
struct ResponseSchema {
    r#type: String,
    properties: serde_json::Value,
    required: Vec<String>,
}

#[derive(Serialize)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Serialize)]
struct Part {
    text: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<Candidate>>,
}

#[derive(Deserialize)]
struct Candidate {
    content: ContentResponse,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ContentResponse {
    parts: Vec<PartResponse>,
}

#[derive(Deserialize)]
struct PartResponse {
    text: String,
}

/// Detect language based on character analysis
pub fn detect_language(text: &str) -> Language {
    // Check for Japanese characters (Hiragana, Katakana, or Kanji)
    let has_japanese = text.chars().any(|c| {
        // Hiragana: U+3040 to U+309F
        // Katakana: U+30A0 to U+30FF
        // CJK Unified Ideographs (Kanji): U+4E00 to U+9FFF
        matches!(c,
            '\u{3040}'..='\u{309F}' |  // Hiragana
            '\u{30A0}'..='\u{30FF}' |  // Katakana
            '\u{4E00}'..='\u{9FFF}'    // Kanji
        )
    });

    if has_japanese {
        Language::Japanese
    } else if text.chars().any(|c| c.is_alphabetic()) {
        Language::English
    } else {
        Language::Unknown
    }
}

/// Shared prompt builder used by both the cloud Gemini API and the local Bonsai provider.
/// The returned string is a full system-style instruction ending with a JSON example.
/// Kept deliberately short: the response_schema already enforces the JSON shape,
/// so the example only demonstrates the tone of the linguistic points.
pub fn build_translation_prompt(text: &str, from_lang: Language, target_lang: &str) -> String {
    format!(
        r#"Translate the following {} text to {}: "{}"

Provide 3 translation suggestions with different formality levels (casual, neutral, formal).

Also provide 2-5 linguistic points explaining WHY you chose specific words or expressions.
These points should be in the TARGET LANGUAGE ({}) and follow this format:
- "「original word/phrase」→ \"translated word\": reason for choice"

EXAMPLE (translating Japanese "こんにちは" to English):
{{ "suggestions": [{{ "text": "Hi", "formality": "casual" }}, {{ "text": "Hello", "formality": "neutral" }}, {{ "text": "Good day", "formality": "formal" }}], "points": ["「こん」comes from 今日 (today), a time-specific greeting", "Translated as 'Hello' - the most natural English equivalent for general greetings"] }}

IMPORTANT:
- Write points ONLY in the TARGET LANGUAGE ({})
- Keep each point concise but informative (10-20 words)
- Focus on WHY specific translations were chosen, not what they mean

Now translate the input text above following this exact format."#,
        from_lang,   // "Japanese"
        target_lang, // "English"
        text,        // "コレはテストですよ"
        target_lang, // "English" - for points
        target_lang  // "English" - emphasis
    )
}

/// JSON schema for the structured translation output.
/// Used by both the Gemini REST API (response_schema) and the local Bonsai provider.
pub fn translation_schema() -> serde_json::Value {
    serde_json::json!({
        "type": "object",
        "properties": {
            "suggestions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "The translated text"
                        },
                        "formality": {
                            "type": "string",
                            "enum": ["casual", "neutral", "formal"],
                            "description": "The formality level of this translation"
                        }
                    },
                    "required": ["text", "formality"]
                }
            },
            "points": {
                "type": "array",
                "items": {
                    "type": "string",
                    "description": "Linguistic reasoning for word/phrase choice (e.g., '「コレ」→ \"this\": demonstrative pronoun')"
                },
                "description": "2-5 linguistic points explaining translation choices in target language"
            }
        },
        "required": ["suggestions", "points"]
    })
}

/// Translate text using Gemini API with multiple suggestions
pub async fn translate_text(
    text: &str,
    api_key: &str,
    from_lang: Language,
) -> Result<TranslationResult> {
    if from_lang == Language::Unknown {
        anyhow::bail!("Cannot translate unknown language");
    }

    let target_lang = match from_lang {
        Language::Japanese => "English",
        Language::English => "Japanese",
        Language::Unknown => unreachable!(),
    };

    let prompt = build_translation_prompt(text, from_lang, target_lang);

    eprintln!("Translating {} -> {}: {}", from_lang, target_lang, text);

    let client = Client::builder()
        .timeout(Duration::from_secs(45))
        .build()
        .context("Failed to build HTTP client")?;
    // Use gemini-3.1-flash-lite (free tier; 2.5-flash-lite's free RPD was too low)
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={}",
        api_key
    );

    // Define JSON schema for structured output
    let schema = translation_schema();

    let request_body = GeminiRequest {
        contents: vec![Content {
            parts: vec![Part { text: prompt }],
        }],
        generation_config: GenerationConfig {
            response_mime_type: "application/json".to_string(),
            response_schema: ResponseSchema {
                r#type: "object".to_string(),
                properties: schema["properties"].clone(),
                required: vec!["suggestions".to_string()],
            },
        },
    };

    let response = client
        .post(&url)
        .json(&request_body)
        .send()
        .await
        .context("Failed to send request to Gemini API")?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        anyhow::bail!("Gemini API error ({}): {}", status, error_text);
    }

    let gemini_response: GeminiResponse = response
        .json()
        .await
        .context("Failed to parse Gemini API response")?;

    let json_text = gemini_response
        .candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content.parts.into_iter().next())
        .map(|p| p.text.trim().to_string())
        .ok_or_else(|| anyhow::anyhow!("No translation found in Gemini response"))?;

    eprintln!("Translation JSON: {}", json_text);

    let result: TranslationResult =
        serde_json::from_str(&json_text).context("Failed to parse translation result JSON")?;

    if result.suggestions.is_empty() {
        anyhow::bail!("No translation suggestions returned");
    }

    eprintln!("Translation suggestions: {}", result.suggestions.len());
    for (i, suggestion) in result.suggestions.iter().enumerate() {
        eprintln!(
            "  [{}] {} ({})",
            i + 1,
            suggestion.text,
            suggestion.formality
        );
    }
    eprintln!("  Linguistic Points ({}):", result.points.len());
    for (i, point) in result.points.iter().enumerate() {
        eprintln!("    [{}] {}", i + 1, point);
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_language_japanese() {
        assert_eq!(detect_language("こんにちは"), Language::Japanese);
        assert_eq!(detect_language("ありがとう"), Language::Japanese);
        assert_eq!(detect_language("カタカナ"), Language::Japanese);
        assert_eq!(detect_language("漢字"), Language::Japanese);
        assert_eq!(detect_language("こんにちは world"), Language::Japanese); // Mixed
    }

    #[test]
    fn test_detect_language_english() {
        assert_eq!(detect_language("Hello"), Language::English);
        assert_eq!(detect_language("Hello world"), Language::English);
        assert_eq!(detect_language("test"), Language::English);
    }

    #[test]
    fn test_detect_language_unknown() {
        assert_eq!(detect_language("123"), Language::Unknown);
        assert_eq!(detect_language("!@#$"), Language::Unknown);
    }
}
