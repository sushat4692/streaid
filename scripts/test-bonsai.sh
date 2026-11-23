#!/usr/bin/env bash
# Runs the Bonsai integration tests against a real MLX server, without
# needing Twitch. Starts the server automatically if it isn't already running
# (e.g. when the app's Local Model toggle is off), and stops it afterwards
# only if this script started it.
#
# Usage:
#   scripts/test-bonsai.sh            # integration tests only
#   scripts/test-bonsai.sh --chat     # interactive: type a sentence, get a translation
set -euo pipefail

BONSAI_DIR="$HOME/Library/Application Support/im.sush.streaid/bonsai"
PYTHON="$BONSAI_DIR/mlx-venv/bin/python"
MODEL="$BONSAI_DIR/models/mlx/Ternary-Bonsai-8B-mlx-2bit"
PORT=4243
BASE="http://127.0.0.1:$PORT"

if [ ! -x "$PYTHON" ] || [ ! -f "$MODEL/model.safetensors" ]; then
  echo "Bonsai is not set up. Run scripts/setup-bonsai.sh first." >&2
  exit 1
fi

started_server=0
if ! curl -sf -m 2 "$BASE/health" > /dev/null 2>&1; then
  echo "Starting MLX server on port $PORT ..."
  "$PYTHON" -m mlx_lm.server --model "$MODEL" --port "$PORT" --temp 0.7 &
  SERVER_PID=$!
  started_server=1
  ready=0
  for _ in $(seq 1 90); do
    if curl -sf -m 2 "$BASE/health" > /dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 1
  done
  if [ "$ready" != "1" ]; then
    echo "MLX server did not become ready." >&2
    kill "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi
  echo "MLX server ready"
else
  echo "Using already-running MLX server on port $PORT"
fi

cleanup() {
  if [ "$started_server" = "1" ]; then
    echo "Stopping MLX server (started by this script)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [ "${1:-}" = "--chat" ]; then
  # Interactive mode: pipe sentences in, get translations out.
  echo "Interactive mode — type a sentence (JA or EN), Ctrl-D to quit:"
  python3 "$(dirname "$0")/bonsai_chat.py"
else
  cd "$(dirname "$0")/.."
  cargo test -- --ignored --nocapture
fi
