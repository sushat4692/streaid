#!/usr/bin/env bash
# Downloads the llama-server binary (Prism ML fork) and the Ternary-Bonsai-8B
# model into the Streaid app data directory so the app can use the local model.
#
# App data dir (macOS): ~/Library/Application Support/im.sush.streaid/bonsai/
#   bin/llama-server
#   models/Ternary-Bonsai-8B-Q2_0.gguf
#
# Re-running the script skips files that are already present.
set -euo pipefail

APP_DATA_DIR="$HOME/Library/Application Support/im.sush.streaid"
BONSAI_DIR="$APP_DATA_DIR/bonsai"
BIN_DIR="$BONSAI_DIR/bin"
MODELS_DIR="$BONSAI_DIR/models"

MODEL_FILE="Ternary-Bonsai-8B-Q2_0.gguf"

RELEASE_TAG="prism-b9596-9fcaed7"
ARCH="$(uname -m)"
case "$ARCH" in
  arm64) ASSET="llama-${RELEASE_TAG}-bin-macos-arm64.tar.gz" ;;
  x86_64) ASSET="llama-${RELEASE_TAG}-bin-macos-x64.tar.gz" ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

BINARY_URL="https://github.com/PrismML-Eng/llama.cpp/releases/download/$RELEASE_TAG/$ASSET"
MODEL_URL="https://huggingface.co/prism-ml/Ternary-Bonsai-8B-gguf/resolve/main/$MODEL_FILE"

mkdir -p "$BIN_DIR" "$MODELS_DIR"

if [ -x "$BIN_DIR/llama-server" ] && [ -f "$BIN_DIR/libggml-metal.0.dylib" ]; then
  echo "llama-server already installed"
else
  echo "Downloading llama-server ($ASSET)..."
  tmp="$(mktemp -d)"
  curl -LsSf "$BINARY_URL" | tar -xz -C "$tmp" --strip-components=1
  rm -f "$BIN_DIR"/llama-* "$BIN_DIR"/lib*.dylib
  cp "$tmp"/llama-* "$tmp"/lib*.dylib "$BIN_DIR/" 2>/dev/null || true
  rm -rf "$tmp"
  # Clear Gatekeeper quarantine and ad-hoc codesign so the binary can run
  xattr -cr "$BIN_DIR" 2>/dev/null || true
  for _f in "$BIN_DIR"/llama-* "$BIN_DIR"/lib*.dylib; do
    [ -f "$_f" ] && codesign -s - --force --timestamp=none "$_f" 2>/dev/null || true
  done
  echo "llama-server installed"
fi

if [ -f "$MODELS_DIR/$MODEL_FILE" ]; then
  echo "Model already present"
else
  echo "Downloading $MODEL_FILE (~2.1 GB)..."
  curl -LsSf -o "$MODELS_DIR/$MODEL_FILE" "$MODEL_URL"
  echo "Model downloaded"
fi

echo ""
echo "Done. Files:"
ls -lh "$BIN_DIR/llama-server" "$MODELS_DIR/$MODEL_FILE"
