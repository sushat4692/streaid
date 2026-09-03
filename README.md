# Streaid

A native macOS desktop app (Zed's **gpui** + **gpui-component**) that listens to a Twitch IRC chat channel and provides real-time Japanese ↔ English translation and dictionary lookup via the Gemini AI API. No WebView, no Node.js — a single lightweight Rust binary.

## Features

- **`!ts`** — real-time Japanese ↔ English translation (3 formality levels + linguistic reasoning)
- **`!d`** — dictionary lookup (meaning, examples, synonyms)
- **Local model (Bonsai)** — optional on-device LLM provider (Apache 2.0, runs offline, no API key)
- **OBS overlay** — live translation events on stream via embedded HTTP server (`http://localhost:4242`)
- **Sound notifications** — configurable slots with volume control
- OAuth2 device flow for Twitch, Gemini API key stored in the OS keyring
- Auto-reconnecting Twitch IRC connection (keepalive heartbeat, backoff, `RECONNECT` handling)

## Stack

Rust (gpui 0.2 / gpui-component / tokio-tungstenite / axum / reqwest / rodio)

## Getting Started

```bash
cargo run --manifest-path app/Cargo.toml
```

> First build requires Xcode + Metal Toolchain (`xcodebuild -downloadComponent MetalToolchain`).

Log in with your Twitch account (device flow), then open the Config page to set your Gemini API key and start the chat listener.

## Development

- **Commands & conventions**: see `AGENTS.md`
- **Architecture**: `docs/architecture.md`
- **IPC reference**: `docs/commands.md`
- **Feature details**: `docs/features.md`
- **Local model (Bonsai)**: `docs/bonsai.md`
- **Manual testing**: `docs/testing.md`

## Local Model Setup (optional)

```bash
scripts/setup-bonsai.sh    # downloads llama-server + Ternary-Bonsai-8B (~2.1 GB)
```

Then toggle "Enable Local Model" in the dashboard. See `docs/bonsai.md`.

## Tests & Checks

```bash
cd app && cargo test && cargo clippy && cargo fmt --check
```