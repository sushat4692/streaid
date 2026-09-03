# AGENTS.md

Streaid is a native macOS desktop app (Zed's **gpui** + **gpui-component**) that listens to a Twitch IRC chat channel and provides real-time Japanese ↔ English translation (`!ts`) and dictionary lookup (`!d`) via the Gemini AI API, with an optional on-device local model (Bonsai).

Stack: Rust (gpui 0.2.2, gpui-component 0.5.1, tokio-tungstenite, axum, reqwest, rodio)

## Commands

```bash
cd app
cargo test                     # Run all tests
cargo test test_name           # Run specific test
cargo test -- --nocapture      # Show println! output
cargo check                    # Fast compilation check
cargo clippy                   # Rust linter
cargo fmt                      # Format Rust code
cargo run                      # Run the app (first build needs Metal toolchain)
cargo packager --release --formats app,dmg   # Build .app/.dmg (needs cargo-packager)
scripts/build-app.sh           # One-shot: release build + .app + .dmg + ad-hoc codesign
```

Packaging settings: `[package.metadata.packager]` in `app/Cargo.toml` (icon `app/icon.icns`).
Outputs land in `app/target/release/` (gitignored).

After completing a task, run: `cd app && cargo test && cargo clippy && cargo fmt --check`.

## Project Structure

- `app/src/lib.rs` — app core: tokio runtime, chat listener supervision (auto-reconnect), Gemini rate limiting + Bonsai fallback, events channel
- `app/src/ui/` — gpui views: `mod.rs` (AppModel + AppView + theme), `login.rs`, `pages/` (shell, dashboard, config, log, model_test, credits)
- `app/src/auth.rs` — Twitch OAuth device flow (OS keyring)
- `app/src/chat.rs` — IRC WebSocket connect/parse
- `app/src/translate.rs` (`!ts`), `dictionary.rs` (`!d`) — Gemini API calls
- `app/src/bonsai.rs` — local model provider (MLX sidecar, ports 4243/4244)
- `app/src/sounds.rs` — sound file storage; playback via `rodio` (play_sound_file)
- `app/src/overlay.rs` — OBS overlay HTTP server (port 4242)
- `scripts/setup-bonsai.sh` — one-shot download of the Bonsai binary + model
- `docs/` — detailed developer documentation (see "External File Loading" below)

## Architecture & Data Flow

```
Twitch IRC → tokio-tungstenite WebSocket → lib.rs run_irc_session (read loop)
  → chat.rs: is_translation_command() / is_dictionary_command()
  → worker task → translate.rs / dictionary.rs: Gemini API call
  → Send messages back to Twitch chat (500ms delay between each)
  → EVENT_TX.send(AppEvent::Translation|Dictionary|ChatMessage) → UI polls event_receiver() every 100ms
  → OVERLAY_TX.send(OverlayMessage) → OBS overlay SSE clients
```

UI ↔ backend: the UI calls `crate::` functions directly (no IPC layer). Events flow through the `AppEvent` channel (`lib.rs`), drained by `AppView`'s polling loop into the shared `AppModel` entity. Status/bonsai state is polled every 2s via `get_chat_status()` / `get_bonsai_status()`.

## Critical Conventions

- **UTF-8 safety (Japanese text)**: always use `floor_char_boundary()` when truncating strings in Rust; byte-index slicing panics on multibyte chars
- **Toggle**: a single dashboard toggle controls both `!ts` and `!d`; when off, both are silently ignored
- **gpui async**: tokio futures must be spawned via `spawn_task()` (uses the app's tokio runtime); the runtime is entered on the main thread so reqwest works from gpui's executor. UI async uses `cx.spawn(async move |_, cx| ...)` (async-closure syntax; `&mut *cx` to reborrow)
- **Events**: never emit from the read loop directly — send `AppEvent` via `emit_event()`
- Secrets (Twitch token, Gemini API key) live in the OS keyring (service `streaid`); never log or commit them
- App data lives in `~/Library/Application Support/streaid` (`app_data_dir()`): bonsai sidecar, sounds, logs, volumes

## External File Loading

CRITICAL: When a task touches the areas below, use your Read tool to load the relevant doc on a need-to-know basis. Do NOT preemptively load all of them. When loaded, treat their content as mandatory instructions.

- `docs/features.md` — `!ts` / `!d` formats, language detection, toggle, sound notifications, OBS overlay details
- `docs/bonsai.md` — local model provider (Bonsai/llama-server sidecar) details
- `docs/conventions.md` — full TS/Rust conventions, credentials, troubleshooting
- `docs/gemini-api.md` — Gemini request/response details (when editing `translate.rs` / `dictionary.rs`)
- `docs/architecture.md` — deeper architecture and module details
- `docs/testing.md` — manual testing guide (when verifying features against Twitch chat)