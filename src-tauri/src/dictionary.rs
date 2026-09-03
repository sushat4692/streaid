use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::translate::Language;

/// Dictionary lookup result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DictionaryResult {
    pub word: String,
    pub meaning: String,
    pub examples: Vec<String>,
    pub similar_words: Vec<String>,
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

/// Shared prompt builder used by both the cloud Gemini API and the local Bonsai provider.
/// The returned string is a full system-style instruction ending with a JSON example.
/// Kept deliberately short: the response_schema already enforces the JSON shape.
pub fn build_dictionary_prompt(word: &str, from_lang: Language, target_lang: &str) -> String {
    format!(
        r#"You are a bilingual dictionary. Provide a dictionary definition for the {} word: "{}"

Return the result in {} (TARGET LANGUAGE).

EXAMPLE (English word "apple" → Japanese):
{{ "word": "apple", "meaning": "りんご。バラ科リンゴ属の落葉高木、またはその果実。", "examples": ["I eat an apple every day. (私は毎日りんごを食べます)", "This apple is very sweet. (このりんごはとても甘い)"], "similar_words": ["fruit", "pome", "orchard fruit", "red apple"] }}

IMPORTANT:
- Write "meaning" ONLY in the TARGET LANGUAGE ({})
- Write "examples" in the SOURCE LANGUAGE with TARGET LANGUAGE translation in parentheses
- Write "similar_words" ONLY in the SOURCE LANGUAGE ({}) - SAME language as the input word "{}"
- Provide 2-3 practical example sentences that USE THE ORIGINAL WORD "{}"
- Each example sentence MUST contain the word "{}" in context
- Provide 3-5 synonyms or related words IN THE SAME LANGUAGE AS THE INPUT WORD
- Keep meaning concise (under 100 words)
- Examples should demonstrate different usage contexts
- DO NOT mix languages in similar_words - they must all be in {} (SOURCE LANGUAGE)

Now provide the dictionary entry for the word above."#,
        from_lang,   // "Japanese"
        word,        // "りんご"
        target_lang, // "English"
        target_lang, // "English" - emphasis for meaning
        from_lang,   // "Japanese" - for similar_words
        word,        // "りんご" - for examples similar_words
        word,        // "りんご" - for examples
        word,        // "りんご" - for examples (repeated)
        from_lang    // "Japanese" - emphasis for similar_words
    )
}

/// JSON schema for the structured dictionary output.
/// Used by both the Gemini REST API (response_schema) and the local Bonsai provider.
pub fn dictionary_schema() -> serde_json::Value {
    serde_json::json!({
        "type": "object",
        "properties": {
            "word": {
                "type": "string",
                "description": "The word being looked up"
            },
            "meaning": {
                "type": "string",
                "description": "Definition in target language (concise, under 100 words)"
            },
            "examples": {
                "type": "array",
                "items": {
                    "type": "string",
                    "description": "Example sentence demonstrating usage"
                },
                "description": "2-3 example sentences in target language"
            },
            "similar_words": {
                "type": "array",
                "items": {
                    "type": "string",
                    "description": "Synonym or related word"
                },
                "description": "3-5 synonyms or related words in target language"
            }
        },
        "required": ["word", "meaning", "examples", "similar_words"]
    })
}

/// Lookup word definition using Gemini API
pub async fn lookup_word(
    word: &str,
    api_key: &str,
    from_lang: Language,
) -> Result<DictionaryResult> {
    if from_lang == Language::Unknown {
        anyhow::bail!("Cannot lookup unknown language");
    }

    let target_lang = match from_lang {
        Language::Japanese => "English",
        Language::English => "Japanese",
        Language::Unknown => unreachable!(),
    };

    let prompt = build_dictionary_prompt(word, from_lang, target_lang);

    eprintln!("Looking up {} word: {}", from_lang, word);

    let client = Client::builder()
        .timeout(Duration::from_secs(45))
        .build()
        .context("Failed to build HTTP client")?;
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={}",
        api_key
    );

    // Define JSON schema for structured output
    let schema = dictionary_schema();

    let request_body = GeminiRequest {
        contents: vec![Content {
            parts: vec![Part { text: prompt }],
        }],
        generation_config: GenerationConfig {
            response_mime_type: "application/json".to_string(),
            response_schema: ResponseSchema {
                r#type: "object".to_string(),
                properties: schema["properties"].clone(),
                required: vec![
                    "word".to_string(),
                    "meaning".to_string(),
                    "examples".to_string(),
                    "similar_words".to_string(),
                ],
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
        .ok_or_else(|| anyhow::anyhow!("No dictionary result found in Gemini response"))?;

    eprintln!("Dictionary JSON: {}", json_text);

    let result: DictionaryResult =
        serde_json::from_str(&json_text).context("Failed to parse dictionary result JSON")?;

    eprintln!("Dictionary result: {} - {}", result.word, result.meaning);
    eprintln!(
        "  Examples ({}): {:?}",
        result.examples.len(),
        result.examples
    );
    eprintln!(
        "  Similar words ({}): {:?}",
        result.similar_words.len(),
        result.similar_words
    );

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::translate::Language;

    #[tokio::test]
    async fn test_lookup_unknown_language_errors() {
        let result = lookup_word("hello", "fake_key", Language::Unknown).await;
        assert!(result.is_err());
    }

    #[test]
    fn test_dictionary_result_deserializes_english() {
        let json = r#"{"word":"apple","meaning":"A round fruit.","examples":["I eat an apple."],"similar_words":["fruit"]}"#;
        let r: DictionaryResult = serde_json::from_str(json).unwrap();
        assert_eq!(r.word, "apple");
    }

    #[test]
    fn test_dictionary_result_deserializes_japanese() {
        let json = r#"{"word":"りんご","meaning":"Apple.","examples":["りんごが好きです"],"similar_words":["果物","フルーツ"]}"#;
        let r: DictionaryResult = serde_json::from_str(json).unwrap();
        assert_eq!(r.word, "りんご");
        assert_eq!(r.similar_words[0], "果物");
    }
}
