# Tauri Commands Reference

All commands are async and return `Result<T, String>` (Rust side: `anyhow::Result<T>` internally).

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
| `set_sound_cmd` | `soundType: string, data: number[], fileName: string` | `void` | Save audio file for a sound slot |
| `get_sound_cmd` | `soundType: string` | `SoundDataResponse \| null` | Retrieve audio as base64 data URL + file name |
| `clear_sound_cmd` | `soundType: string` | `void` | Delete audio file for a sound slot |
| `get_overlay_url_cmd` | — | `string` | Returns `"http://localhost:4242"` |
| `set_local_model_cmd` | `enabled: bool` | `void` | Enable/disable the Bonsai sidecar (spawn/kill llama-server) and switch provider |
| `get_bonsai_status_cmd` | — | `BonsaiStatus` | Local model status (enabled, server running, binary/model present) |
| `test_translation_cmd` | `text: string, provider: "gemini" \| "bonsai"` | `ModelTestResult` | One-shot translation with a chosen provider (dashboard comparison UI) |

`targetChannel` is optional; if omitted, monitors the authenticated user's own channel. It is auto-sanitized (lowercased, `#` stripped, max 25 chars, alphanumeric + underscore only).

Note: `greet` (template leftover) is still registered in the backend but unused by the frontend. `debug_token_status` is the only command without a `_cmd` suffix.

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

export type BonsaiStatus = {
  enabled: boolean
  server_running: boolean
  binary_found: boolean
  model_found: boolean
}

export type ModelTestResult = {
  source_lang: string
  target_lang: string
  suggestions: TranslationSuggestion[]
  points: string[]
  duration_ms: number
}

export type ChatMessageEvent = {
  username: string
  message: string
  channel: string
  timestamp: string
}

export type SoundData = {
  data_url: string   // base64 data URL
  file_name: string
}
```
