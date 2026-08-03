# Features

## Translation Command: `!ts`

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

## Dictionary Command: `!d`

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

## Language Detection (`translate.rs`)

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

## Toggle

A single toggle on the dashboard controls both `!ts` and `!d`. When off, both commands are silently ignored.

## Sound Notifications

- Two configurable sound slots: `first` (new chatter) and `remaining` (returning chatter)
- Upload any MP3/WAV/OGG/M4A/AAC; stored in app data dir `sounds/`
- Per-slot volume control; configured via Config page → Sound Notifications

## OBS Overlay

- axum HTTP server auto-starts on `http://localhost:4242` when app launches
- `GET /` → transparent HTML overlay (embedded `overlay.html`)
- `GET /events` → SSE stream; each `!ts`/`!d` result pushed as named SSE events
- Displays queue of 5 most recent events, each fades out after 12s
- URL shown in Config page → OBS Overlay with one-click copy button
- Add as OBS Browser Source (recommended: 1600×600, transparent background)

## Local Model (Bonsai)

Optional on-device provider that replaces the cloud Gemini API for both `!ts` and `!d`:

- **Toggle** in the Chat Listener card (dashboard): "Enable Local Model"
- When enabled, requests go to locally running `mlx_lm.server` sidecars (ports 4243 = 8B, 4244 = 4B); the Gemini API key is not used
- **Chat model**: a small 8B / 4B selector (next to the toggle) picks which model
  actually answers `!ts` / `!d` in chat; the choice is persisted to disk
- When disabled, the Gemini path is used as before
- The sidecars are spawned when enabling and killed when disabling or on app exit
- Models: Ternary-Bonsai-8B (2-bit, ~2.3 GB, default) and Ternary-Bonsai-4B
  (2-bit, ~1.1 GB, optional) — see `scripts/setup-bonsai.sh` and `docs/bonsai.md`

Setup:

```bash
scripts/setup-bonsai.sh            # 8B only (~2.3 GB)
scripts/setup-bonsai.sh --with-4b  # also download 4B for the lighter option
```

Requirements: macOS arm64/x64, ~4 GB disk, ~4 GB RAM free for inference.
The models take a few seconds to load on enable; until then the status shows "Starting...".
Translation quality is lower than Gemini 3.1-flash-lite — use for cost/privacy testing.
If the local server errors, the command is skipped and logged (no silent fallback to Gemini).

## Gemini Rate Limiting & Fallback

The Gemini free tier is limited (~10 requests/minute). To avoid 429 errors during
busy chat:

- **Global token bucket**: Gemini calls (chat `!ts`/`!d` and the Model Test page)
  are capped at **8 requests/minute** (`GEMINI_RPM_LIMIT` in `lib.rs`)
- **When the budget is exhausted**: if the local Bonsai model is running, the
  command is answered by the local model automatically (logged as
  `[fallback]`); otherwise the command is skipped with a log
- **On a 429 from Gemini**: same automatic local fallback when available
- **Diagnostics**: Gemini errors (including the 429 quota details) and rate-limit
  events are appended to `streaid.log` in the app data directory
  (`~/Library/Application Support/im.sush.streaid/streaid.log`)

## Model Test (sidebar → Model Test)

The Model Test page lets anyone test a provider without Twitch chat: pick a
provider with the switch (Gemini 3.1 Flash Lite, Local Model 8B, or Local
Model 4B), pick a
mode (`!ts` 翻訳 or `!d` 辞書), enter a sentence/word (JA or EN), and press
Translate/Lookup to see the result for that provider only (suggestions +
linguistic points for `!ts`; meaning + examples + similar words for `!d`,
including duration). Powered by `test_model_cmd`. The Bonsai side must be
running (toggle it on in the Chat Listener card first).

