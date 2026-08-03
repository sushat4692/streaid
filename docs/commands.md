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
| `set_local_model_cmd` | `enabled: bool` | `void` | Enable/disable the Bonsai sidecars (spawn/kill llama-server, all available models) and switch provider |
| `set_local_model_variant_cmd` | `model: "8b" \| "4b"` | `void` | Select which local model answers `!ts` / `!d` in chat (persisted to disk) |
| `get_bonsai_status_cmd` | — | `BonsaiStatus` | Local model status (enabled, active model, per-model running/file state) |
| `test_model_cmd` | `text: string, provider: "gemini" \| "bonsai-8b" \| "bonsai-4b", mode: "ts" \| "d"` | `ModelTestResult` | One-shot translation (`ts`) or dictionary lookup (`d`) with a chosen provider (Model Test page) |

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

export type BonsaiModelStatus = {
  name: '8b' | '4b'
  running: boolean
  model_found: boolean
}

export type BonsaiStatus = {
  enabled: boolean
  binary_found: boolean
  active_model: '8b' | '4b'
  models: BonsaiModelStatus[]
}

export type ModelTestResult =
  | {
      mode: 'ts'
      source_lang: string
      target_lang: string
      suggestions: TranslationSuggestion[]
      points: string[]
      duration_ms: number
    }
  | {
      mode: 'd'
      source_lang: string
      target_lang: string
      word: string
      meaning: string
      examples: string[]
      similar_words: string[]
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
