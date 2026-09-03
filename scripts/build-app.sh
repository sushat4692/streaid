#!/usr/bin/env bash
# Build a release .app bundle and .dmg for local use.
set -euo pipefail

cd "$(dirname "$0")/../app"

cargo build --release
cargo packager --release --formats app,dmg

# Local-use ad-hoc signature (Gatekeeper-friendly on this machine)
codesign --force --deep -s - target/release/Streaid.app

echo
echo "Done:"
echo "  app/target/release/Streaid.app"
echo "  app/target/release/Streaid_0.6.0_aarch64.dmg"