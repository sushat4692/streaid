# Code Conventions

## TypeScript

- `type Props = { ... }` for component props (prefer `type` over `interface`)
- Default exports for components, named exports for utilities
- Strict mode enabled; avoid `any`

## Rust

- Tauri command naming: snake_case with `_cmd` suffix; return `Result<T, String>`
- Error handling: `anyhow::Result<T>` internally; add context with `.context("message")`
- Async: tokio runtime (via Tauri); all Tauri commands are `async fn`
- Serialization: `#[derive(Debug, Serialize, Deserialize, Clone)]` for types exposed to frontend

## UTF-8 Safety — critical for Japanese text

Always use `floor_char_boundary()` when truncating strings. Byte-index slicing panics on multibyte characters:

```rust
// CORRECT ✅
let safe_len = s.floor_char_boundary(max_len);
let truncated = &s[..safe_len];

// WRONG ❌ — panics on Japanese text
let truncated = &s[..max_len];
```

## Credentials & Storage

- Twitch token and Gemini API key stored in OS keyring (service name: `streaid`)
- Twitch client ID stored to disk via `dirs` crate
- Never log or commit secrets

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
