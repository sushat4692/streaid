# AGENTS.md

Streaid is a Tauri desktop app that listens to a Twitch IRC chat channel and provides real-time Japanese ↔ English translation (`!ts`) and dictionary lookup (`!d`) via the Gemini AI API, displaying results in a React frontend.

Stack: React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS v4 + Tauri 2 + Rust

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
pnpm test                 # Vitest (frontend unit tests)
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

After completing a task, run: `pnpm run format && pnpm run lint && pnpm test` and `cd src-tauri && cargo test`. This also runs automatically via the `session.idle` plugin hook (`.opencode/plugins/auto-verify.ts`).

## Project Structure

- `src/` — React frontend (routes, components, contexts, types, utils)
- `src/routes/` — TanStack Router file-based routes; `src/routeTree.gen.ts` is auto-generated, never edit manually
- `src-tauri/src/` — Rust backend: `lib.rs` (commands + IRC listener loop), `auth.rs` (Twitch OAuth), `chat.rs` (IRC), `translate.rs` (`!ts`), `dictionary.rs` (`!d`), `sounds.rs`, `overlay.rs` (OBS overlay, port 4242)
- `docs/` — detailed developer documentation (see "External File Loading" below)

## Architecture & Data Flow

```
Twitch IRC → tokio-tungstenite WebSocket → lib.rs listener loop
  → chat.rs: is_translation_command() / is_dictionary_command()
  → translate.rs / dictionary.rs: Gemini API call
  → Send messages back to Twitch chat (500ms delay between each)
  → app.emit("translation" | "dictionary", event)  →  React UI
  → app.emit("chat_message", ChatMessageEvent)      →  React UI (every message)
  → OVERLAY_TX.send(OverlayMessage)                 →  OBS overlay SSE clients
```

Frontend ↔ backend communication: `invoke()` for commands, `listen()` for events (both from `@tauri-apps/api`).

## Critical Conventions

- **UTF-8 safety (Japanese text)**: always use `floor_char_boundary()` when truncating strings in Rust; byte-index slicing panics on multibyte chars
- **Toggle**: a single dashboard toggle controls both `!ts` and `!d`; when off, both are silently ignored
- **`src/routeTree.gen.ts` is auto-generated** — never edit it directly
- Tauri commands are snake_case with `_cmd` suffix, return `Result<T, String>`
- Secrets (Twitch token, Gemini API key) live in the OS keyring (service `streaid`); never log or commit them
- `src/routes/` files prefixed with `-` are ignored by the router plugin

## External File Loading

CRITICAL: When a task touches the areas below, use your Read tool to load the relevant doc on a need-to-know basis. Do NOT preemptively load all of them. When loaded, treat their content as mandatory instructions.

- `docs/commands.md` — full Tauri command reference + TS event types (when working on frontend/backend IPC or event payloads)
- `docs/features.md` — `!ts` / `!d` formats, language detection, toggle, sound notifications, OBS overlay details
- `docs/conventions.md` — full TS/Rust conventions, credentials, troubleshooting
- `docs/gemini-api.md` — Gemini request/response details (when editing `translate.rs` / `dictionary.rs`)
- `docs/architecture.md` — deeper architecture and module details
- `docs/testing.md` — manual testing guide (when verifying features against Twitch chat)
