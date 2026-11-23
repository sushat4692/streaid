#!/usr/bin/env bash
# Compile and run the Swift FFI contract test against the real Rust core.
#
# - Builds the static library + module map if needed.
# - Disables background services (overlay server / keychain refresh) so the
#   test is hermetic.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist/macos"

if [ ! -f "$DIST/libstreaid_ffi.a" ] || [ ! -f "$DIST/StreaidFFI/module.modulemap" ]; then
  "$ROOT/scripts/build-core.sh"
fi

TMP="$(mktemp -d)"
export STREAID_DATA_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP" "$STREAID_DATA_DIR"' EXIT

export STREAID_DISABLE_BACKGROUND=1

swiftc -O \
  -I "$DIST" \
  "$ROOT/apps/macos/Streaid/Bridge/StreaidModels.swift" \
  "$ROOT/apps/macos/Streaid/Bridge/StreaidCore.swift" \
  "$ROOT/apps/macos/ContractTests/ContractTest.swift" \
  "$ROOT/apps/macos/ContractTests/main.swift" \
  "$DIST/libstreaid_ffi.a" \
  -framework AudioUnit -framework CoreAudio -framework SystemConfiguration \
  -framework Security -framework CoreFoundation -liconv \
  -o "$TMP/streaid-contract"

"$TMP/streaid-contract"
