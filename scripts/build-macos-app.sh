#!/usr/bin/env bash
# Build the macOS SwiftUI app and place a runnable .app in dist/macos/.
#
# Usage:
#   scripts/build-macos-app.sh            # Release build
#   scripts/build-macos-app.sh --debug    # Debug build
#   scripts/build-macos-app.sh --open     # build then launch it
#
# Xcode.app is required (xcodebuild + SwiftUI SDK), but the Xcode GUI is not.
set -euo pipefail

export PATH="$HOME/.cargo/bin:$HOME/.local/share/mise/shims:/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="Release"
OPEN_APP=0

for arg in "$@"; do
  case "$arg" in
    --debug) CONFIG="Debug" ;;
    --open) OPEN_APP=1 ;;
    -h|--help)
      sed -n '2,10p' "$0"
      exit 0
      ;;
    *)
      echo "unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

PROJECT_DIR="$ROOT/apps/macos"
PROJECT="$PROJECT_DIR/Streaid.xcodeproj"
DERIVED="$ROOT/dist/macos/DerivedData"
APP="$ROOT/dist/macos/Streaid.app"

# Regenerate the project when project.yml changed (or it is missing).
if [ ! -d "$PROJECT" ] || [ "$PROJECT_DIR/project.yml" -nt "$PROJECT/project.pbxproj" ]; then
  if ! command -v xcodegen >/dev/null 2>&1; then
    echo "error: xcodegen is required to regenerate the project" >&2
    echo "       install with: brew install xcodegen" >&2
    exit 1
  fi
  echo "==> xcodegen generate"
  (cd "$PROJECT_DIR" && xcodegen generate >/dev/null)
fi

echo "==> cargo core (release)"
"$ROOT/scripts/build-core.sh" >/dev/null

echo "==> xcodebuild ($CONFIG)"
xcodebuild \
  -project "$PROJECT" \
  -scheme Streaid \
  -configuration "$CONFIG" \
  -derivedDataPath "$DERIVED" \
  CODE_SIGNING_ALLOWED=NO \
  -quiet \
  build

BUILT_APP="$DERIVED/Build/Products/$CONFIG/Streaid.app"
if [ ! -d "$BUILT_APP" ]; then
  echo "error: build output not found at $BUILT_APP" >&2
  exit 1
fi

echo "==> package dist/macos/Streaid.app"
rm -rf "$APP"
cp -R "$BUILT_APP" "$APP"
codesign --force --deep -s - "$APP" >/dev/null 2>&1 || true

echo
echo "Done:"
echo "  $APP"
if [ "$OPEN_APP" = "1" ]; then
  echo "==> open"
  open "$APP"
fi
