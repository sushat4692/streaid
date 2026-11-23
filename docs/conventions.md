# Code Conventions

## Repository layering

- `crates/streaid-core` — UI-agnostic Rust. No AppKit / SwiftUI / windowing dependencies.
- `crates/streaid-ffi` — C ABI + JSON dispatch. Keep this the single contract for UIs.
- `apps/macos` — SwiftUI app. It must not duplicate business logic; call the core.

## Rust

- Error handling: `anyhow::Result<T>` internally; add context with `.context("message")`.
  User-facing command/API functions return `Result<T, String>`.
- Async: the core owns a leaked tokio runtime (`init_runtime`, `spawn_task`, `block_on`).
  Do not create additional runtimes.
- Serialization: `#[derive(Serialize, Deserialize, Clone)]` for types crossing the
  FFI boundary.
- FFI method names: `area.action` (e.g. `chat.start`, `sounds.save`). JSON field names are
  snake_case and are part of the public contract.
- Never call `block_on` from a runtime worker thread or re-entrantly from an FFI call.

## UTF-8 Safety — critical for Japanese text

Always use `floor_char_boundary()` when truncating strings. Byte-index slicing panics on
multibyte characters:

```rust
// CORRECT ✅
let safe_len = s.floor_char_boundary(max_len);
let truncated = &s[..safe_len];

// WRONG ❌ — panics on Japanese text
let truncated = &s[..max_len];
```

## SwiftUI

- `AppState` is `@MainActor` and is the single view model. Views do not own business state.
- All core calls go through `StreaidCore` (async wrapper). Long calls run on its private
  serial queue; never call `callData` from the main actor for `model.test` etc.
- Every `char *` returned by the core is released by `streaid_free` inside the wrapper.
- App lifecycle: `AppDelegate.applicationWillTerminate` calls `core.shutdownSync()` so
  Bonsai child processes are stopped. Closing the last window quits the app.
- Use the existing theme (`Theme`) and components (`Card`, `SectionCard`, `Pill`,
  `PrimaryButtonStyle`, …) instead of one-off styles.
- Test escape hatches: `STREAID_SKIP_AUTH=1` (stay on login, no Keychain) and
  `STREAID_DISABLE_BACKGROUND=1` (no overlay server / token refresh).

## FFI / JSON contract

- Source of truth: `crates/streaid-ffi/src/api.rs` + `crates/streaid-ffi/include/streaid.h`.
- `system.capabilities.api_version` is bumped only for breaking changes. Additive fields
  and methods are not breaking.
- Never rename JSON fields; update all frontends when changing a payload.
- Events are polled: `events.poll` / `streaid_poll_events()` returns an array of
  `{type, data}`. Unknown event types must be ignored.
- FFI strings are UTF-8 JSON; ownership is documented in `docs/ffi.md`.

## Credentials & Storage

- Twitch token and Gemini API key are stored in the macOS Keychain (service `streaid`).
- Twitch client ID, last channel, local-model variant and vocabulary live in
  `app_data_dir()` (`~/Library/Application Support/im.sush.streaid`).
- Never log or commit secrets.

## Troubleshooting

- **Commands not working**: check the `!ts` / `!d` toggle, the listener status pill, and
  that the Gemini key (or local model) is configured.
- **UI not updating**: run from Xcode and check the console for `AppState` / core errors;
  the event stream polls every 100 ms and status every 2 s.
- **API errors**: check the Gemini key and free-tier quota; the core logs rate-limit and
  fallback decisions to stderr.
- **Local model**: if Bonsai fails to start, check `bonsai/mlx-server-*.log` in the app
  data directory and run `scripts/setup-bonsai.sh`.
