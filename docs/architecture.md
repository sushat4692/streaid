# Architecture

## Overview

Tauri desktop app: a Rust backend runs a Twitch IRC WebSocket listener and calls the Gemini AI API; a React frontend displays results in real time. An embedded axum HTTP server serves an OBS browser-source overlay.

## Data Flow

```
Twitch IRC → tokio-tungstenite WebSocket → lib.rs listener loop
  → chat.rs: is_translation_command() / is_dictionary_command()
  → translate.rs / dictionary.rs: Gemini API call
  → Send messages back to Twitch chat (500ms delay between each)
  → app.emit("translation" | "dictionary", event)  →  React UI
  → app.emit("chat_message", ChatMessageEvent)      →  React UI (every message)
  → OVERLAY_TX.send(OverlayMessage)                 →  OBS overlay SSE clients
```

## Frontend (`src/`)

| Concern | Detail |
|---------|--------|
| Routing | TanStack Router with file-based routing in `src/routes/`. `src/routeTree.gen.ts` is auto-generated — **do not edit it manually**. Files prefixed with `-` are ignored by the router plugin. |
| Entry | `main.tsx` → `App.tsx` → TanStack Router renders `routes/login.tsx` or `routes/dashboard.tsx` |
| State | Local React hooks + React context only; no global state library |
| Styling | Tailwind CSS v4 via `@import 'tailwindcss'` in `index.css`; use `cx` (classnames) for conditional classes |
| Backend communication | `invoke()` for commands, `listen()` for events (both from `@tauri-apps/api`) |

Components live in `src/components/`, contexts in `src/contexts/`, types in `src/types/chat.ts`, utilities in `src/utils/` (with tests in `src/utils/__tests__/`).

## Backend (`src-tauri/src/`)

| File | Responsibility |
|------|---------------|
| `lib.rs` | Tauri command registration, global shared state, IRC chat listener loop |
| `auth.rs` | Twitch OAuth2 device flow, token storage/refresh via OS keyring |
| `chat.rs` | Twitch IRC WebSocket connection, command parsing helpers |
| `translate.rs` | `!ts` command: Gemini API call, language detection, `TranslationResult` |
| `dictionary.rs` | `!d` command: Gemini API call, `DictionaryResult` |
| `sounds.rs` | Audio file save/retrieve/delete for notification sound slots; stores in app data `sounds/` dir |
| `overlay.rs` | OBS overlay: axum HTTP server on port 4242, SSE endpoint, static `OVERLAY_TX` broadcast channel |
| `overlay.html` | Transparent overlay HTML embedded into the binary |

## Tauri Commands

Full reference (all 19 commands with args/return types): `docs/commands.md`

## Backend State & Events

- Shared state: `Arc<Mutex<T>>` with `once_cell::sync::Lazy` for statics
- Frontend events: `"translation"`, `"dictionary"`, `"chat_message"` — payload types in `docs/commands.md`
- Overlay SSE: named SSE events pushed from `OVERLAY_TX` broadcast channel

## Technical Limits

- Twitch message max length: 500 characters (truncated with `...` using UTF-8 safe method)
- Rate limiting: 500ms delay between consecutive Twitch chat messages
- Translation: sends 4 messages (~2s total); Dictionary: sends 3 messages (~1.5s total)
