# Gemini API

Used by both `!ts` (translate.rs) and `!d` (dictionary.rs). One API key is shared; no caching.

## Request

- **Model**: `gemini-2.5-flash-lite` (free tier supported)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`
- **Response format**: Structured JSON via `response_schema` + `response_mime_type: "application/json"` in request body

## Structured Output Pattern

```rust
let request_body = GeminiRequest {
    contents: vec![Content { parts: vec![Part { text: prompt }] }],
    generation_config: GenerationConfig {
        response_mime_type: "application/json".to_string(),
        response_schema: ResponseSchema { /* JSON schema */ },
    },
};
let gemini_response: GeminiResponse = response.json().await?;
let result: TranslationResult = serde_json::from_str(&json_text)?;
```
