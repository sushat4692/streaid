# Local Model Provider (Bonsai)

Optional on-device LLM provider for `!ts` / `!d`, used instead of the cloud
Gemini API. Runs **Bonsai** (Prism ML, Apache 2.0, ternary-quantized) through a
local `llama-server` sidecar.

## Why Bonsai

- Open weights (Apache 2.0), GGUF format — can be bundled/run inside the desktop app
  (unlike Chrome's built-in Gemini Nano, which is Chrome-only and cannot run in the
  Tauri WKWebView)
- Ternary (1.58-bit) quantization: Ternary-Bonsai-4B Q2_0 is only ~1.1 GB on disk
  (Gemma 3n E2B Q4_K_M would be ~3 GB; Nano needs ~22 GB free space)
- Runs fully offline; no API key, no chat data leaves the machine

## Requirements

- macOS (arm64 or x64) — this trial targets macOS only
- ~2 GB free disk, ~2 GB RAM free for inference
- macOS Gatekeeper: `scripts/setup-bonsai.sh` clears the quarantine attribute
  and ad-hoc codesigns the binary

## Setup

```bash
scripts/setup-bonsai.sh
```

Downloads into the app data directory:

```
~/Library/Application Support/im.sush.streaid/bonsai/
  bin/llama-server                          (Prism ML llama.cpp fork, macos)
  models/Ternary-Bonsai-4B-Q2_0.gguf        (~1.1 GB)
  llama-server.log                          (sidecar stderr, written at runtime)
```

## Runtime

- Toggle "Enable Local Model" in the dashboard → backend spawns:

  ```
  llama-server -m models/Ternary-Bonsai-4B-Q2_0.gguf
               --host 127.0.0.1 --port 4243 -c 8192 --jinja
  ```

- Backend polls `GET /health` until ready (up to 60 s), then `!ts` / `!d`
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
- Model variants: Ternary-Bonsai 8B Q2_0 (2.1 GB) is the next step up if 4B
  quality is insufficient (update `BONSAI_MODEL_FILE` in `lib.rs` and the script)

## Files

- `src-tauri/src/bonsai.rs` — OpenAI-compatible client + health check
- `src-tauri/src/lib.rs` — sidecar spawn/kill, `set_local_model_cmd`,
  `get_bonsai_status_cmd`, provider branching in the chat listener
- `scripts/setup-bonsai.sh` — one-shot download of binary + model
- `src/components/ChatControl.tsx` — toggle + status UI
