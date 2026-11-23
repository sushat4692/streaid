# Local Model Provider (Bonsai)

Optional on-device LLM provider for `!ts` / `!d`, used instead of the cloud
Gemini API. Runs **Bonsai** (Prism ML, Apache 2.0, ternary-quantized) through
`mlx_lm.server` (Apple's MLX framework — significantly faster than the
llama.cpp backend, especially prompt prefill).

## Why Bonsai + MLX

- Open weights (Apache 2.0), MLX safetensors — run natively on Apple Silicon
- Ternary (1.58-bit) quantization: Ternary-Bonsai-8B 2-bit is ~2.3 GB on disk
  (Gemma 3n E4B Q4_K_M would be ~4.5 GB; Chrome's Nano needs ~22 GB free space)
- Runs fully offline; no API key, no chat data leaves the machine
- Measured on an M1: ~2x faster than the llama.cpp (GGUF) backend — decode
  ~21–26 tok/s vs ~9–15 tok/s, prefill ~300 tok/s vs ~36 tok/s

## Requirements

- macOS on Apple Silicon (MLX does not run on Intel Macs)
- ~4 GB free disk, ~4 GB RAM free for inference
- Python 3 (used only to create the bundled venv)

## Setup

```bash
scripts/setup-bonsai.sh            # 8B only (recommended default)
scripts/setup-bonsai.sh --with-4b  # also download the lighter 4B model
```

Installs into the app data directory:

```
~/Library/Application Support/im.sush.streaid/bonsai/
  mlx-venv/                                      (Python venv with mlx-lm)
  models/mlx/Ternary-Bonsai-8B-mlx-2bit/         (~2.3 GB, port 4243)
  models/mlx/Ternary-Bonsai-4B-mlx-2bit/         (~1.1 GB, port 4244, optional)
  mlx-server-{8b,4b}.log                         (server stderr, written at runtime)
```

## Runtime

- Toggle "Enable Local Model" in the Chat Listener card → backend spawns one
  MLX server per model directory that is present:

  ```
  <venv>/bin/python -m mlx_lm.server --model models/mlx/Ternary-Bonsai-8B-mlx-2bit \
      --port 4243 --temp 0.7
  ```

- **Chat model selection**: the "Chat model: 8B / 4B" selector next to the
  toggle picks which model answers `!ts` / `!d` in chat (`set_local_model_variant_cmd`,
  persisted to `~/Library/Application Support/im.sush.streaid/local_model_variant`)
- Backend polls `GET /health` until ready (up to 90 s), then `!ts` / `!d`
  requests go to `POST /v1/chat/completions` with
  `response_format: { type: "json_schema", json_schema: {...} }`
- The JSON schemas and prompts are shared with the Gemini provider
  (`translate::translation_schema`, `dictionary::dictionary_schema`)
- The request body omits the `model` field — mlx_lm.server rejects unknown
  model names (it would try to fetch them from HuggingFace) but ignores the
  field when omitted
- No fallback: if the local server errors, the command is skipped and logged
  (`[bonsai]` prefix)
- **Automatic fallback INTO Bonsai**: when the Gemini path hits its rate limit
  (8 requests/min budget) or returns a 429, chat commands are automatically
  answered by the local model if it is running (logged as `[fallback]`) — see
  `docs/features.md`

## Known limitations

- Apple Silicon only (no Intel Mac support)
- `mlx_lm.server` is single-user by design and warns it is "not recommended for
  production" — fine for localhost use
- No cross-request prompt cache (each request re-prefills), but prefill is
  ~300 tok/s so it barely matters for these short requests
- Translation quality is lower than Gemini 3.1-flash-lite — verify on real chat
  before relying on it
- The 4B (port 4244) is the lighter option (~1.1 GB / ~2 GB RAM) for weaker
  machines, at the cost of the EN→JA quality drop noted below

## Measured quality (Aug 2026 trial, Ternary-Bonsai-8B)

| Case | Result |
|---|---|
| JA→EN translation | Good — natural formality levels + linguistic points |
| EN→JA translation | Usable — natural grammar, but occasional broken katakana loanwords (e.g. ステーミング) and English leftovers |
| Dictionary | Good — clean meanings/examples, no duplicate synonyms |
| Latency (MLX, M1) | ~10 s per request (~21 tok/s decode) |
| 4B comparison | 4B faster (~26 tok/s decode) but EN→JA was word-by-word and dictionary had duplicate synonyms |

Overall: usable as a free/offline option, quality clearly below Gemini 3.1-flash-lite
for EN→JA. Prompt engineering (explicit "use natural katakana" guidance) may
improve the EN→JA case.

## Testing without Twitch

- **App UI**: the Model Test page (sidebar) translates a sentence with any
  provider (Gemini, Local 8B, Local 4B) via a switch (needs the Local Model
  toggle enabled so the servers run)
- **Integration tests**: `scripts/test-bonsai.sh` — spawns the MLX server if
  needed and runs the Rust integration tests (`bonsai::translate`,
  `bonsai::lookup_word`) against it
- **Interactive CLI**: `scripts/test-bonsai.sh --chat` — pipe sentences in,
  get translations out (uses `scripts/bonsai_chat.py`)

## Files

- `crates/streaid-core/src/bonsai.rs` — OpenAI-compatible client (per-server base URL)
- `crates/streaid-core/src/lib.rs` — sidecar spawn/kill (one per model), model registry
  (`BONSAI_MODELS`), `set_local_model_cmd`, `set_local_model_variant_cmd`,
  `get_bonsai_status_cmd`, provider branching in the chat listener
- `scripts/setup-bonsai.sh` — one-shot setup: venv + mlx-lm + model downloads
- `src/components/ChatControl.tsx` — toggle + chat model selector + status UI
