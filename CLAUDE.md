# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Streaid is a Tauri desktop app that listens to a Twitch IRC chat channel and provides real-time Japanese ↔ English translation (`!ts`) and dictionary lookup (`!d`) via the Gemini AI API, displaying results in a React frontend.

Stack: React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS v4 + Tauri 2 + Rust

---

## Commands

### Frontend
```bash
pnpm dev                  # Start Vite dev server (port 1420, used standalone)
pnpm tauri dev            # Launch full Tauri app with hot reload (preferred)
pnpm build                # tsc + vite build
pnpm tauri build          # Build production Tauri app
pnpm lint                 # oxlint on src/
pnpm format               # oxfmt on src/
pnpm format:check         # Check formatting without writing
pnpm exec tsc --noEmit    # TypeScript type check only
```

### Backend (Rust)
```bash
cd src-tauri
cargo test                     # Run all tests
cargo test test_name           # Run specific test
cargo test -- --nocapture      # Show println! output
cargo check                    # Fast compilation check
cargo clippy                   # Rust linter
cargo fmt                      # Format Rust code
```

---

## Architecture

### Frontend (`src/`)

- **Routing**: TanStack Router with file-based routing. Routes live in `src/routes/`. The generated route tree (`src/routeTree.gen.ts`) is auto-generated — do not edit it manually. Files prefixed with `-` are ignored by the router plugin.
- **Entry**: `main.tsx` → `App.tsx` → TanStack Router renders `routes/login.tsx` or `routes/dashboard.tsx`
- **State**: Local React hooks only; no global state library
- **Styling**: Tailwind CSS v4 via `@import 'tailwindcss'` in `index.css`; use `cx` (classnames) for conditional classes
- **Backend communication**: `invoke()` for commands, `listen()` for events (both from `@tauri-apps/api`)

### Backend (`src-tauri/src/`)

| File | Responsibility |
|------|---------------|
| `lib.rs` | Tauri command registration, global shared state, IRC chat listener loop |
| `auth.rs` | Twitch OAuth2 device flow, token storage/refresh via OS keyring |
| `chat.rs` | Twitch IRC WebSocket connection, command parsing helpers |
| `translate.rs` | `!ts` command: Gemini API call, language detection, `TranslationResult` |
| `dictionary.rs` | `!d` command: Gemini API call, `DictionaryResult` |

### Data Flow

```
Twitch IRC → tokio-tungstenite WebSocket → lib.rs listener loop
  → chat.rs: is_translation_command() / is_dictionary_command()
  → translate.rs / dictionary.rs: Gemini API call
  → Send messages back to Twitch chat (500ms delay between each)
  → app.emit("translation" | "dictionary", event)  →  React UI
```

---

## Features

### Translation Command: `!ts`

Detects language automatically and translates Japanese ↔ English.

```
!ts こんにちは   →  4 Twitch chat replies:
  [1/3] [casual] Hi!
  [2/3] [neutral] Hello
  [3/3] [formal] Greetings
  翻訳の根拠: 「こんにちは」→ 'hello': standard greeting...
```

Backend struct (`translate.rs`):
```rust
pub struct TranslationResult {
    pub suggestions: Vec<TranslationSuggestion>,  // 3 suggestions
    pub points: Vec<String>,                       // 2-5 linguistic reasoning points
}
pub struct TranslationSuggestion {
    pub text: String,
    pub formality: String,  // "casual" | "neutral" | "formal"
}
```

### Dictionary Command: `!d`

Looks up only the **first word** (`!d apple pie` → looks up "apple").

```
!d りんご   →  3 Twitch chat replies:
  [Dict] りんご - Apple. A deciduous tree...
  [Examples] りんごが好きです (I like apples) | ...
  [Synonyms] 果物, フルーツ, 林檎, ...
```

Backend struct (`dictionary.rs`):
```rust
pub struct DictionaryResult {
    pub word: String,
    pub meaning: String,
    pub examples: Vec<String>,        // 2-3 examples in source lang + translation
    pub similar_words: Vec<String>,   // 3-5 synonyms in source language only
}
```

### Language Detection (`translate.rs`)

```rust
pub fn detect_language(text: &str) -> Language {
    let has_japanese = text.chars().any(|c| matches!(c,
        '\u{3040}'..='\u{309F}' |  // Hiragana
        '\u{30A0}'..='\u{30FF}' |  // Katakana
        '\u{4E00}'..='\u{9FFF}'    // Kanji
    ));
    if has_japanese { Language::Japanese }
    else if text.chars().any(|c| c.is_alphabetic()) { Language::English }
    else { Language::Unknown }  // silently skipped
}
```

### Toggle

A single toggle on the dashboard controls both `!ts` and `!d`. When off, both commands are silently ignored.

---

## Tauri Commands Reference

| Command | Arguments | Return | Description |
|---------|-----------|--------|-------------|
| `start_device_flow_cmd` | `clientId: string, scopes: string[]` | `DeviceCodeInfo` | Start OAuth device flow |
| `poll_device_flow_cmd` | — | `TokenInfo \| null` | Poll for auth completion |
| `get_stored_token_cmd` | — | `TokenInfo \| null` | Get stored token from keyring |
| `clear_stored_token_cmd` | — | `void` | Delete stored token |
| `refresh_token_cmd` | — | `TokenInfo \| null` | Refresh access token |
| `open_url_cmd` | `url: string` | `void` | Open URL in system browser |
| `debug_token_status` | — | `DebugTokenStatus` | Debug token state |
| `set_client_id_cmd` | `clientId: string` | `void` | Save client ID to disk |
| `get_client_id_cmd` | — | `string \| null` | Load client ID from disk |
| `set_gemini_api_key_cmd` | `apiKey: string` | `void` | Save Gemini API key to keyring |
| `get_gemini_api_key_cmd` | — | `string \| null` | Get masked API key |
| `start_chat_listener_cmd` | `targetChannel?: string` | `void` | Start Twitch IRC chat listener |
| `stop_chat_listener_cmd` | — | `void` | Stop chat listener |
| `get_chat_status_cmd` | — | `ChatStatus` | Get listener status |
| `toggle_translation_cmd` | `enabled: bool` | `void` | Enable/disable `!ts` and `!d` |

`targetChannel` is optional; if omitted, monitors the authenticated user's own channel. It is auto-sanitized (lowercased, `#` stripped, max 25 chars, alphanumeric + underscore only).

---

## TypeScript Types (`src/types/chat.ts`)

```typescript
export type TranslationSuggestion = {
  text: string
  formality: 'casual' | 'neutral' | 'formal'
}

export type TranslationEvent = {
  original_user: string
  original_message: string
  suggestions: TranslationSuggestion[]  // 3 items
  points: string[]                       // 2-5 linguistic reasoning points
  timestamp: string
  source_lang: string
  target_lang: string
}

export type DictionaryEvent = {
  original_user: string
  original_word: string
  word: string
  meaning: string
  examples: string[]        // 2-3 items
  similar_words: string[]   // 3-5 items
  timestamp: string
  source_lang: string
  target_lang: string
}

export type ChatStatus = {
  connected: boolean
  is_running: boolean
  is_enabled: boolean
  channel: string | null
  last_target_channel?: string | null
}
```

---

## Key Conventions

### TypeScript
- `type Props = { ... }` for component props (prefer `type` over `interface`)
- Default exports for components, named exports for utilities
- Strict mode enabled; avoid `any`

### Rust
- Tauri command naming: snake_case with `_cmd` suffix; return `Result<T, String>`
- Error handling: `anyhow::Result<T>` internally; add context with `.context("message")`
- Shared state: `Arc<Mutex<T>>` with `once_cell::sync::Lazy` for statics
- Async: tokio runtime (via Tauri); all Tauri commands are `async fn`
- Serialization: `#[derive(Debug, Serialize, Deserialize, Clone)]` for types exposed to frontend

#### UTF-8 Safety — critical for Japanese text
Always use `floor_char_boundary()` when truncating strings. Byte-index slicing panics on multibyte characters:
```rust
// CORRECT ✅
let safe_len = s.floor_char_boundary(max_len);
let truncated = &s[..safe_len];

// WRONG ❌ — panics on Japanese text
let truncated = &s[..max_len];
```

### Credentials & Storage
- Twitch token and Gemini API key stored in OS keyring (service name: `streaid`)
- Twitch client ID stored to disk via `dirs` crate

---

## Gemini API

- **Model**: `gemini-2.5-flash-lite` (free tier supported)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`
- **Response format**: Structured JSON via `response_schema` + `response_mime_type: "application/json"` in request body
- Both `!ts` and `!d` share one API key; no caching

Structured output pattern:
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

---

## Technical Limits

- **Twitch message max length**: 500 characters (truncated with `...` using UTF-8 safe method)
- **Rate limiting**: 500ms delay between consecutive Twitch chat messages
- **Translation**: sends 4 messages (~2s total); **Dictionary**: sends 3 messages (~1.5s total)

---

## Troubleshooting

- **Commands not working**: check toggle is enabled, IRC shows "Connected", Gemini API key is set
- **UI not updating**: check browser DevTools console for event errors, verify `listen()` cleanup is correct
- **API errors**: check keyring has `streaid/gemini_api_key`, check Gemini free-tier quota

### Safe compiler warnings to ignore
```
warning: unused import: `sleep`
warning: unused import: `Manager`
warning: unused variable: `interval`
warning: field `channel` is never read
```

---

## Additional Reference

- `TESTING_GUIDE.md`: Manual testing instructions
