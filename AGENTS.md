# AGENTS.md

Streaid is a native macOS app that listens to a Twitch IRC chat channel and provides
real-time Japanese ↔ English translation (`!ts`) and dictionary lookup (`!d`) via the
Gemini AI API, with an optional on-device local model (Bonsai).

The repository is a **monorepo**:
- `crates/streaid-core` — UI-agnostic Rust core
- `crates/streaid-ffi` — C ABI (JSON) consumed by SwiftUI (future frontends can reuse it)
- `apps/macos` — the macOS SwiftUI app (the only UI)
- Windows is a future possibility only; see `docs/future.md`

Stack: Rust (tokio-tungstenite, axum, reqwest, rodio, keyring) + SwiftUI (macOS 13+, arm64).

## Commands

Run from the repository root:

```bash
cargo test                          # Core + FFI tests
cargo test -p streaid-core          # Core only
cargo test -p streaid-ffi           # C ABI / JSON API tests
cargo test -p streaid-core test_name
cargo test -p streaid-core -- --nocapture
cargo check -p streaid-core
cargo clippy --workspace --all-targets
cargo fmt --all
```

macOS app:

```bash
scripts/build-macos-app.sh --open   # core + app + ad-hoc sign + launch
scripts/build-macos-app.sh --debug
scripts/package-macos.sh            # .app + DMG (optional notarization)
scripts/test-ffi-swift.sh           # Swift <-> Rust contract test
scripts/build-core.sh               # dist/macos/libstreaid_ffi.a + module map

open apps/macos/Streaid.xcodeproj   # Xcode (⌘R)
```

The Xcode target has a pre-build script that runs `scripts/build-core.sh`.
After editing `apps/macos/project.yml`, regenerate with `xcodegen generate`.

After completing a task, run:

```bash
cargo test --workspace && cargo clippy --workspace --all-targets && cargo fmt --all --check
```

## Project Structure

```
Cargo.toml                  # workspace (core + ffi)
crates/streaid-core/        # UI-agnostic Rust core (no UI dependencies)
  src/lib.rs                # runtime, state, chat supervision, rate limiting, events
  src/auth.rs               # Twitch OAuth device flow (OS keyring)
  src/chat.rs               # IRC WebSocket connect/parse
  src/translate.rs          # !ts (Gemini / local model)
  src/dictionary.rs         # !d (Gemini / local model)
  src/bonsai.rs             # local model client (llama-server, ports 4243/4244)
  src/sounds.rs             # sound storage + rodio playback
  src/overlay.rs            # OBS overlay HTTP server (port 4242)
  src/vocabulary.rs         # vocabulary tracking
  src/platform.rs           # OS capability detection (MLX availability, etc.)
crates/streaid-ffi/         # C ABI (JSON) for SwiftUI / future frontends
  src/lib.rs                # extern "C": init / dispatch / poll_events / free
  src/api.rs                # method dispatch table (single source of truth)
  include/streaid.h
apps/macos/                 # SwiftUI app (XcodeGen)
  project.yml
  Streaid/
    App/                    # StreaidApp + AppState + AppDelegate
    Bridge/                 # StreaidCore.swift / StreaidModels.swift
    Theme/                  # palette
    Views/                  # Login, Shell, Dashboard, Config, ModelTest, Log, ...
    Resources/              # Assets.xcassets / Info.plist
  StreaidUITests/           # login-screen UI smoke test
  ContractTests/            # Swift -> core contract test
packaging/                  # packaging assets/notes
scripts/                    # build-core, build-macos-app, package-macos, Bonsai setup
docs/                       # developer documentation (see "External File Loading")
```

## Architecture & Data Flow

```
Twitch IRC → tokio-tungstenite WebSocket → streaid-core::run_irc_session (read loop)
  → chat.rs: is_translation_command() / is_dictionary_command()
  → worker task → translate.rs / dictionary.rs: Gemini or local model
  → Send messages back to Twitch chat (500ms delay between each)
  → EVENT_TX.send(AppEvent::Translation|Dictionary|ChatMessage)
      → SwiftUI: StreaidCore.eventStream() polls streaid_poll_events() every 100 ms
  → OVERLAY_TX.send(OverlayMessage) → OBS overlay SSE clients
```

SwiftUI calls the core through the JSON C ABI (`StreaidCore.swift`). The core keeps
the authoritative state; `AppState` is a main-actor mirror of status + events.
Status/local-model state is polled every 2 s via `chat.status` / `model.status`.

The C ABI contract lives in `crates/streaid-ffi/src/api.rs`; add a method there and it is
immediately usable from every native frontend. Keep JSON field names stable and bump
`system.capabilities.api_version` only for breaking changes.

## Critical Conventions

- **UTF-8 safety (Japanese text)**: always use `floor_char_boundary()` when truncating strings in Rust; byte-index slicing panics on multibyte chars
- **Toggle**: a single dashboard toggle controls both `!ts` and `!d`; when off, both are silently ignored
- **FFI threading**: `streaid_dispatch()` may block (e.g. `model.test`, `auth.poll_device_flow`). Call it off the UI thread. `StreaidCore.swift` already serializes calls on a private queue; never call `callData` from the main actor for long operations
- **FFI ownership**: every `char *` from the core must be released with `streaid_free()`
- **App termination**: `AppDelegate.applicationWillTerminate` calls `core.shutdownSync()` so Bonsai child processes are killed
- **App data**: `app_data_dir()` (macOS `~/Library/Application Support/im.sush.streaid`). Must match the bundle identifier so existing data is preserved: bonsai sidecar, sounds, logs, volumes
- **Secrets**: Twitch token and Gemini API key live in the macOS Keychain (service `streaid`); never log or commit them
- **Platform-specific features**: gate macOS-only code behind `platform::local_model_supported()`; do not add Windows code until `docs/future.md` says work has started
- **UI test escape hatches**: `STREAID_SKIP_AUTH=1` (skip Keychain, stay on login), `STREAID_DISABLE_BACKGROUND=1` (skip overlay/token refresh), and `STREAID_FORCE_LOCALE=ja` (Japanese UI)
- **Events**: never emit from the read loop directly — send `AppEvent` via `emit_event()`

## External File Loading

CRITICAL: When a task touches the areas below, use your Read tool to load the relevant doc on a need-to-know basis. Do NOT preemptively load all of them. When loaded, treat their content as mandatory instructions.

- `docs/ffi.md` — C ABI / JSON method reference (when touching `crates/streaid-ffi` or a native frontend)
- `docs/native-ui-migration.md` — migration history and current remaining tasks
- `docs/future.md` — deferred directions (Windows)
- `docs/feature-parity-plan.md` — Electron-era feature comparison and restoration plan
- `docs/features.md` — `!ts` / `!d` formats, language detection, toggle, sound notifications, OBS overlay details
- `docs/bonsai.md` — local model provider (Bonsai/llama-server sidecar) details
- `docs/conventions.md` — full Rust conventions, credentials, troubleshooting
- `docs/gemini-api.md` — Gemini request/response details (when editing `translate.rs` / `dictionary.rs`)
- `docs/architecture.md` — deeper architecture and module details
- `docs/testing.md` — manual testing guide (when verifying features against Twitch chat)
