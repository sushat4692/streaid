#!/usr/bin/env bash
# Runs the Bonsai integration tests against a real llama-server, without
# needing Twitch. Starts the server automatically if it isn't already running
# (e.g. when the app's Local Model toggle is off), and stops it afterwards
# only if this script started it.
#
# Usage:
#   scripts/test-bonsai.sh            # integration tests only
#   scripts/test-bonsai.sh --chat     # interactive: type a sentence, get a translation
set -euo pipefail

BONSAI_DIR="$HOME/Library/Application Support/im.sush.streaid/bonsai"
BIN="$BONSAI_DIR/bin/llama-server"
MODEL="$BONSAI_DIR/models/Ternary-Bonsai-8B-Q2_0.gguf"
PORT=4243
BASE="http://127.0.0.1:$PORT"

if [ ! -x "$BIN" ] || [ ! -f "$MODEL" ]; then
  echo "Bonsai is not set up. Run scripts/setup-bonsai.sh first." >&2
  exit 1
fi

started_server=0
if ! curl -sf -m 2 "$BASE/health" > /dev/null 2>&1; then
  echo "Starting llama-server on port $PORT ..."
  "$BIN" -m "$MODEL" --host 127.0.0.1 --port "$PORT" -c 8192 --jinja &
  SERVER_PID=$!
  started_server=1
  ready=0
  for _ in $(seq 1 60); do
    if curl -sf -m 2 "$BASE/health" > /dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 2
  done
  if [ "$ready" != "1" ]; then
    echo "llama-server did not become ready (see log)." >&2
    kill "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi
  echo "llama-server ready"
else
  echo "Using already-running llama-server on port $PORT"
fi

cleanup() {
  if [ "$started_server" = "1" ]; then
    echo "Stopping llama-server (started by this script)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [ "${1:-}" = "--chat" ]; then
  # Interactive mode: pipe sentences in, get translations out.
  echo "Interactive mode — type a sentence (JA or EN), Ctrl-D to quit:"
  python3 "$(dirname "$0")/bonsai_chat.py"
else
  cd "$(dirname "$0")/../src-tauri"
  cargo test -- --ignored --nocapture
fi
