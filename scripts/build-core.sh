#!/usr/bin/env bash
# Build the UI-agnostic core as a static library for the macOS SwiftUI app.
#
# Output: dist/macos/libstreaid_ffi.a, dist/macos/streaid.h,
#         dist/macos/StreaidFFI/module.modulemap
#
# arm64 only: Intel Macs are intentionally not supported.
# Set MACOSX_DEPLOYMENT_TARGET to match the Swift app (default 13.0).
set -euo pipefail

# Xcode build phases often have a minimal PATH.
export PATH="$HOME/.cargo/bin:$HOME/.local/share/mise/shims:/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/macos"
TARGET="aarch64-apple-darwin"

# Match the Swift app's deployment target. Without this, native objects
# (ring/aws-lc, etc.) inherit the build host SDK version and the linker warns
# that the static library is "built for a newer macOS".
export MACOSX_DEPLOYMENT_TARGET="${MACOSX_DEPLOYMENT_TARGET:-13.0}"

if ! rustup target list --installed | grep -qx "$TARGET"; then
  echo "error: $TARGET is not installed (run: rustup target add $TARGET)" >&2
  exit 1
fi

mkdir -p "$OUT"

echo "==> cargo build ($TARGET)"
cargo build -p streaid-ffi --release --target "$TARGET" --manifest-path "$ROOT/Cargo.toml"

cp "$ROOT/target/$TARGET/release/libstreaid_ffi.a" "$OUT/libstreaid_ffi.a"
cp "$ROOT/crates/streaid-ffi/include/streaid.h" "$OUT/streaid.h"

# Clang module map for Swift (`import StreaidFFI`). Add dist/macos to the
# Xcode target's header/module search paths.
mkdir -p "$OUT/StreaidFFI"
cp "$ROOT/crates/streaid-ffi/include/streaid.h" "$OUT/StreaidFFI/streaid.h"
cat > "$OUT/StreaidFFI/module.modulemap" <<'MODULEMAP'
module StreaidFFI {
  header "streaid.h"
  export *
}
MODULEMAP

echo
echo "Done:"
echo "  $OUT/libstreaid_ffi.a"
echo "  $OUT/streaid.h"
echo "  $OUT/StreaidFFI/module.modulemap"
echo
echo "Linker flags (from: cargo rustc -- --print native-static-libs):"
echo "  -framework AudioUnit -framework CoreAudio -framework SystemConfiguration"
echo "  -framework Security -framework CoreFoundation -liconv -lSystem -lc -lm"
