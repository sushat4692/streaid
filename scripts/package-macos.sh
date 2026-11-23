#!/usr/bin/env bash
# Build a distributable Streaid.app + DMG.
#
# Usage:
#   scripts/package-macos.sh                 # ad-hoc signed DMG (local testing)
#   DEVELOPER_ID="Developer ID Application: ..." \
#     NOTARY_PROFILE="streaid-notary" \
#     scripts/package-macos.sh               # Developer ID + notarization
#
# Notarization requires a stored notarytool keychain profile:
#   xcrun notarytool store-credentials streaid-notary \
#     --apple-id ... --team-id ... --password ...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/dist/macos/Streaid.app"

"$ROOT/scripts/build-macos-app.sh" "$@"

VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP/Contents/Info.plist")"

if [ -n "${DEVELOPER_ID:-}" ]; then
  echo "==> codesign (Developer ID + hardened runtime)"
  codesign --force --deep --options runtime --timestamp \
    --sign "$DEVELOPER_ID" "$APP"
  codesign --verify --deep --strict --verbose=2 "$APP"
fi

DMG="$ROOT/dist/macos/Streaid-${VERSION}.dmg"
echo "==> hdiutil ($DMG)"
rm -f "$DMG"
hdiutil create \
  -volname "Streaid" \
  -srcfolder "$APP" \
  -ov -format UDZO \
  "$DMG" >/dev/null

if [ -n "${DEVELOPER_ID:-}" ] && [ -n "${NOTARY_PROFILE:-}" ]; then
  echo "==> notarize"
  xcrun notarytool submit "$DMG" \
    --keychain-profile "$NOTARY_PROFILE" \
    --wait
  xcrun stapler staple "$DMG"
  xcrun stapler validate "$DMG"
fi

echo
echo "Done:"
echo "  $APP"
echo "  $DMG"
