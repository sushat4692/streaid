#!/usr/bin/env bash
# Sets up the MLX runtime and downloads the Bonsai models into the Streaid
# app data directory so the app can use the local model.
#
# Usage:
#   ./setup-bonsai.sh            # 8B model only (recommended default)
#   ./setup-bonsai.sh --with-4b  # also download the lighter 4B model
#
# App data dir (macOS): ~/Library/Application Support/im.sush.streaid/bonsai/
#   mlx-venv/                                   (Python venv with mlx-lm)
#   models/mlx/Ternary-Bonsai-8B-mlx-2bit/      (8B, ~2.3 GB, port 4243)
#   models/mlx/Ternary-Bonsai-4B-mlx-2bit/      (4B, ~1.1 GB, port 4244, optional)
#
# Re-running the script skips files that are already present.
set -euo pipefail

INCLUDE_4B=0
if [ "${1:-}" = "--with-4b" ]; then
  INCLUDE_4B=1
elif [ $# -gt 0 ]; then
  echo "Usage: $0 [--with-4b]" >&2
  exit 1
fi

APP_DATA_DIR="$HOME/Library/Application Support/im.sush.streaid"
BONSAI_DIR="$APP_DATA_DIR/bonsai"
MLX_DIR="$BONSAI_DIR/models/mlx"
VENV="$BONSAI_DIR/mlx-venv"

mkdir -p "$MLX_DIR"

if [ ! -x "$VENV/bin/python" ]; then
  echo "Creating Python venv and installing mlx-lm (this can take a minute)..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q mlx-lm
  echo "MLX runtime installed"
else
  echo "MLX runtime already installed"
fi

download_model() {
  local name="$1"
  if [ -f "$MLX_DIR/$name/model.safetensors" ]; then
    echo "Model $name already present"
  else
    echo "Downloading $name..."
    "$VENV/bin/hf" download "prism-ml/$name" --local-dir "$MLX_DIR/$name"
    echo "Model $name downloaded"
  fi
}

download_model "Ternary-Bonsai-8B-mlx-2bit"

if [ "$INCLUDE_4B" = "1" ]; then
  download_model "Ternary-Bonsai-4B-mlx-2bit"
fi

echo ""
echo "Done. Models:"
ls -d "$MLX_DIR"/*/ 2>/dev/null
