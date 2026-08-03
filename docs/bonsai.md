# Local Model Provider (Bonsai)

Optional on-device LLM provider for `!ts` / `!d`, used instead of the cloud
Gemini API. Runs **Bonsai** (Prism ML, Apache 2.0, ternary-quantized) through a
local `llama-server` sidecar.

## Why Bonsai

- Open weights (Apache 2.0), GGUF format — can be bundled/run inside the desktop app
  (unlike Chrome's built-in Gemini Nano, which is Chrome-only and cannot run in the
  Tauri WKWebView)
- Ternary (1.58-bit) quantization: Ternary-Bonsai-8B Q2_0 is only ~2.1 GB on disk
  (Gemma 3n E4B Q4_K_M would be ~4.5 GB; Nano needs ~22 GB free space)
- Runs fully offline; no API key, no chat data leaves the machine

## Requirements

- macOS (arm64 or x64) — this trial targets macOS only
- ~4 GB free disk, ~4 GB RAM free for inference
- macOS Gatekeeper: `scripts/setup-bonsai.sh` clears the quarantine attribute
  and ad-hoc codesigns the binary

## Setup

```bash
scripts/setup-bonsai.sh            # 8B only (recommended default)
scripts/setup-bonsai.sh --with-4b  # also download the lighter 4B model
```

Downloads into the app data directory:

```
~/Library/Application Support/im.sush.streaid/bonsai/
  bin/llama-server                          (Prism ML llama.cpp fork, macos)
  models/Ternary-Bonsai-8B-Q2_0.gguf        (~2.1 GB, port 4243)
  models/Ternary-Bonsai-4B-Q2_0.gguf        (~1.1 GB, port 4244, optional)
  llama-server-{8b,4b}.log                  (sidecar stderr, written at runtime)
```

## Runtime

- Toggle "Enable Local Model" in the Chat Listener card → backend spawns one
  llama-server per model file that is present:

  ```
  llama-server -m models/Ternary-Bonsai-8B-Q2_0.gguf
               --host 127.0.0.1 --port 4243 -c 8192 --jinja
  llama-server -m models/Ternary-Bonsai-4B-Q2_0.gguf
               --host 127.0.0.1 --port 4244 -c 8192 --jinja   (if downloaded)
  ```

- **Chat model selection**: the "Chat model: 8B / 4B" selector next to the
  toggle picks which model answers `!ts` / `!d` in chat (`set_local_model_variant_cmd`,
  persisted to `~/Library/Application Support/streaid/local_model_variant`)
- Backend polls `GET /health` until ready (up to 90 s), then `!ts` / `!d`
  requests go to `POST /v1/chat/completions` with
  `response_format: { type: "json_schema", json_schema: {...} }`
- The JSON schemas and prompts are shared with the Gemini provider
  (`translate::translation_schema`, `dictionary::dictionary_schema`)
- No fallback: if the local server errors, the command is skipped and logged
  (`[bonsai]` prefix)

## Known limitations

- Requires the Prism ML llama.cpp fork (Q2_0 ternary kernels not yet in
  upstream llama.cpp); binary obtained from GitHub Release `prism-b9596-9fcaed7`
- Temperature is fixed at 0.7 (llama-server default is 0.8); not exposed in UI
- Translation quality is lower than Gemini 2.5-flash-lite — verify on real chat
  before relying on it
- Both models share the 8192-token context; the 4B (port 4244) is the lighter
  option (~1.1 GB / ~2 GB RAM) for weaker machines, at the cost of the EN→JA
  quality drop noted below

## Measured quality (Aug 2026 trial, Ternary-Bonsai-8B Q2_0)

| Case | Result |
|---|---|
| JA→EN translation | Good — natural formality levels + linguistic points |
| EN→JA translation | Usable — natural grammar, but occasional broken katakana loanwords (e.g. ステーミング) and English leftovers |
| Dictionary | Good — clean meanings/examples, no duplicate synonyms |
| Latency | ~12–17 s per request (M-series, single slot) |
| 4B comparison | 4B was faster (~7–11 s) but EN→JA was word-by-word and dictionary had duplicate synonyms |

Overall: usable as a free/offline option, quality clearly below Gemini 2.5-flash-lite
for EN→JA. Prompt engineering (explicit "use natural katakana" guidance) may
improve the EN→JA case.

## Testing without Twitch

- **App UI**: the Model Test page (sidebar) translates a sentence with any
  provider (Gemini, Local 8B, Local 4B) via a switch (needs the Local Model
  toggle enabled so the servers run)
- **Integration tests**: `scripts/test-bonsai.sh` — spawns llama-server if
  needed and runs the Rust integration tests (`bonsai::translate`,
  `bonsai::lookup_word`) against it
- **Interactive CLI**: `scripts/test-bonsai.sh --chat` — pipe sentences in,
  get translations out (uses `scripts/bonsai_chat.py`)

## Files

- `src-tauri/src/bonsai.rs` — OpenAI-compatible client (per-server base URL)
- `src-tauri/src/lib.rs` — sidecar spawn/kill (one per model), model registry
  (`BONSAI_MODELS`), `set_local_model_cmd`, `set_local_model_variant_cmd`,
  `get_bonsai_status_cmd`, provider branching in the chat listener
- `scripts/setup-bonsai.sh` — one-shot download of binary + models
- `src/components/ChatControl.tsx` — toggle + chat model selector + status UI
