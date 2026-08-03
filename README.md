# Streaid

A Tauri desktop app that listens to a Twitch IRC chat channel and provides real-time Japanese ↔ English translation and dictionary lookup via the Gemini AI API, with a React frontend.

## Features

- **`!ts`** — real-time Japanese ↔ English translation (3 formality levels + linguistic reasoning)
- **`!d`** — dictionary lookup (meaning, examples, synonyms)
- **OBS overlay** — live translation events on stream via embedded HTTP server (`http://localhost:4242`)
- **Sound notifications** — configurable slots with volume control
- OAuth2 device flow for Twitch, Gemini API key stored in the OS keyring

## Stack

React 19 + TypeScript + Vite + TanStack Router + Tailwind CSS v4 · Tauri 2 + Rust (tokio-tungstenite, axum, reqwest)

## Getting Started

```bash
pnpm install
pnpm tauri dev        # requires Tauri 2 CLI
```

Open the Config page to authenticate Twitch and set your Gemini API key, then enable the translation toggle.

## Development

- **Commands & conventions**: see `AGENTS.md`
- **Architecture**: `docs/architecture.md`
- **IPC reference**: `docs/commands.md`
- **Feature details**: `docs/features.md`
- **Manual testing**: `docs/testing.md`

## Tests & Checks

```bash
pnpm run format && pnpm run lint && pnpm test    # frontend
cd src-tauri && cargo test                        # backend
```
