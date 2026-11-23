# C ABI / JSON API

The Rust core (`crates/streaid-core`) is exposed to native frontends through a
small C ABI in `crates/streaid-ffi`. Frontends never link Rust types directly;
they exchange UTF-8 JSON.

Source of truth:
- C header: `crates/streaid-ffi/include/streaid.h`
- Method table: `crates/streaid-ffi/src/api.rs`
- Contract tests: `cargo test -p streaid-ffi`, `scripts/test-ffi-swift.sh`

## Functions

```c
void  streaid_init(void);
char *streaid_dispatch(const char *request);
char *streaid_poll_events(void);
char *streaid_version(void);
void  streaid_free(char *ptr);
```

- Every returned `char *` is allocated by Rust and must be released with
  `streaid_free()`.
- `streaid_dispatch` and `streaid_poll_events` return JSON objects and never
  return NULL on normal operation.
- Panics inside the core are caught and returned as
  `{"ok":false,"error":"panic in core"}`.

## Initialization

Call `streaid_init()` exactly once, **on the main thread**, at app launch.
It creates the tokio runtime and the event channel, then starts background
services (OBS overlay server on port 4242 and the Twitch token refresh loop).

For tests and CLI harnesses, set:

```bash
export STREAID_DISABLE_BACKGROUND=1
```

to skip the overlay server and token refresh (no ports, no keychain access).
On Unix, set this in the shell rather than only from managed code: .NET does
not always propagate `Environment.SetEnvironmentVariable` to the native
environment (it does on Windows).
The runtime is still created, so async methods work.

## Request / response envelope

```json
// request
{"method":"chat.status","params":{}}

// success
{"ok":true,"result":{ ... }}

// failure
{"ok":false,"error":"missing parameter: text"}
```

`params` may be omitted when the method takes no arguments.
The response `result` may be `null`, an object, an array, or a scalar.

## Threading rules

1. `streaid_init()` — main thread, once.
2. `streaid_dispatch()` — **not** the UI thread. Async methods block until the
   core finishes (e.g. `model.test` can take several seconds; `auth.poll_device_flow`
   returns when the user authorizes or the device code expires).
   - Swift: the wrapper runs calls on a private serial `DispatchQueue`.
   - Other frontends: use an equivalent background queue/thread.
3. `streaid_poll_events()` — every ~100 ms from any thread; non-blocking.
4. Never call `streaid_dispatch()` re-entrantly from inside a core callback
   (there are no callbacks today; events are polled).

## Method reference

### system

| Method | Params | Result |
|---|---|---|
| `system.capabilities` | — | `{api_version, os, platform, local_model_supported, app_data_dir, overlay_url}` |
| `system.app_data_dir` | — | `string` |
| `system.overlay_url` | — | `string` (`http://localhost:4242`) |
| `system.shutdown` | — | `null` (stops local model sidecars) |
| `events.poll` / `system.drain_events` | — | `[Event]` |

`api_version` is `1`. Treat unknown fields as additive.

### auth

| Method | Params | Result |
|---|---|---|
| `auth.status` | — | `{has_token, error}` (keychain error is surfaced, not thrown) |
| `auth.has_token` | — | `bool` |
| `auth.stored_token` | — | `TokenInfo \| null` |
| `auth.save_client_id` | `client_id` | `null` |
| `auth.load_client_id` | — | `string \| null` |
| `auth.start_device_flow` | `client_id` | `DeviceCodeInfo` |
| `auth.poll_device_flow` | — | `TokenInfo \| null` |
| `auth.device_flow_interval` | — | `number \| null` (updated on `slow_down`) |
| `auth.clear` | — | `null` |

`start_device_flow` and `poll_device_flow` share one process-wide state, so they
can be called from separate FFI invocations.

### gemini

| Method | Params | Result |
|---|---|---|
| `gemini.set_key` | `key` | `null` |
| `gemini.key_masked` | — | `string \| null` |
| `gemini.has_key` | — | `bool` |

### chat listener

| Method | Params | Result |
|---|---|---|
| `chat.status` | — | `ChatStatus` |
| `chat.start` | `channel?: string` | `null` |
| `chat.stop` | — | `null` |
| `chat.toggle` | `enabled: bool` | `null` |

`channel` omitted / `null` = the authenticated user's own channel.
`chat.toggle` controls both `!ts` and `!d`.

### local model

| Method | Params | Result |
|---|---|---|
| `model.status` | — | `BonsaiStatus` |
| `model.set_enabled` | `enabled: bool` | `null` |
| `model.set_variant` | `model: "8b" \| "4b"` | `null` |
| `model.test` | `text, provider, mode` | `ModelTestResult` |

`provider` is `"gemini"`, `"bonsai-8b"` or `"bonsai-4b"`.
`mode` is `"ts"` (translation) or `"d"` (dictionary).
`model.*` is only meaningful on macOS; on platforms without MLX
`system.capabilities.local_model_supported` is `false` and the UI should hide it.

### sounds

| Method | Params | Result |
|---|---|---|
| `sounds.save` | `slot, file_name, data_b64` | `null` |
| `sounds.get` | `slot` | `SoundFile \| null` |
| `sounds.delete` | `slot` | `null` |
| `sounds.play` | `path, volume?: 0.0–1.0` | `null` |

`slot` is `"first"` (new chatter) or `"remaining"` (returning chatter).
`data_b64` is standard base64 (not URL-safe).

### vocabulary

| Method | Params | Result |
|---|---|---|
| `vocab.summary` | — | `VocabularySummary` |
| `vocab.top` | `n?: number` (default 20) | `[[word, count]]` |
| `vocab.clear` | — | `null` |
| `vocab.analyze` | — | `[CategoryResult]` |

### overlay

| Method | Params | Result |
|---|---|---|
| `overlay.session_lookups` | — | `[SessionLookup]` |

## Event shapes (`events.poll`)

```json
{"type":"translation","data":{
  "original_user":"alice","original_message":"こんにちは",
  "suggestions":[{"text":"Hello","formality":"neutral"}],
  "points":["..."],"timestamp":"2026-01-01T00:00:00Z",
  "source_lang":"Japanese","target_lang":"English"}}
```

```json
{"type":"dictionary","data":{
  "original_user":"bob","original_word":"serendipity",
  "word":"serendipity","meaning":"...","examples":["..."],
  "similar_words":["..."],"timestamp":"...",
  "source_lang":"English","target_lang":"Japanese"}}
```

```json
{"type":"chat_message","data":{
  "username":"carol","display_name":"Carol","user_id":"123","color":"#FF0000",
  "badges":["moderator/1"],"is_mod":true,"is_vip":false,"is_broadcaster":false,
  "is_subscriber":false,"message":"hi","channel":"mychannel","timestamp":"..."}}
```

```json
{"type":"raid","data":{
  "from_login":"raider","from_display_name":"Raider","viewers":42,
  "channel":"mychannel","timestamp":"..."}}
```

Unknown `type` values must be ignored (forward compatibility).

## Type shapes

```text
DeviceCodeInfo   { verification_uri, user_code, expires_in, interval }
TokenInfo        { access_token, refresh_token?, expires_in?, scope?, login?, user_id? }
ChatStatus       { connected, is_running, is_enabled, reconnecting, channel?, last_target_channel? }
BonsaiStatus     { enabled, runtime_found, active_model, models: [{name, running, model_found}] }
ModelTestResult  { mode: "ts", source_lang, target_lang, suggestions, points, duration_ms }
                 { mode: "d",  source_lang, target_lang, word, meaning, examples, similar_words, duration_ms }
SoundFile        { path, file_name }
VocabularySummary{ total_words, total_lookups, top_words: [{word, count, source_forms: [[form,count]]}], ambiguous: [{word,count,candidates}] }
CategoryResult   { category, words, total_count }
SessionLookup    { word, timestamp }
ChatMessageEvent { username, display_name, user_id?, color?, badges, is_mod, is_vip, is_broadcaster, is_subscriber, message, channel, timestamp }
RaidEvent        { from_login, from_display_name, viewers, channel, timestamp }
```

## Platform frontends

### Swift (macOS)

```bash
scripts/build-core.sh          # dist/macos/libstreaid_ffi.a + StreaidFFI/module.modulemap
```

Wrapper: `apps/macos/Streaid/Bridge/StreaidCore.swift`
Models: `apps/macos/Streaid/Bridge/StreaidModels.swift`
Contract test: `scripts/test-ffi-swift.sh`

```swift
let core = StreaidCore()             // main thread
let caps = try await core.capabilities()
let stream = core.eventStream()      // AsyncStream<[StreaidEvent]>
```

### Future frontends

Windows is a possible future direction but is not implemented. The same C ABI
can be consumed from any language; `streaid-ffi` has a `cdylib` crate type for
building a shared library on another platform. See `docs/future.md`.

## Versioning

- `system.capabilities.api_version` is bumped only for breaking changes.
- Additive fields/methods are not breaking; clients must ignore unknown fields.
- The JSON field names are part of the contract; do not rename them.
