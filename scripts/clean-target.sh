#!/usr/bin/env bash
# Free disk space used by Rust build artifacts.
#
# Default: remove dev/test artifacts (and incremental caches) but keep the
# release build that the Xcode app links against.
#
# Usage:
#   scripts/clean-target.sh            # dev/test only (keeps release)
#   scripts/clean-target.sh --release  # release only
#   scripts/clean-target.sh --all      # everything
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="dev"
for arg in "$@"; do
    case "$arg" in
        --release) MODE="release" ;;
        --all) MODE="all" ;;
        -h|--help)
            sed -n '2,12p' "$0"
            exit 0
            ;;
        *)
            echo "unknown option: $arg" >&2
            exit 1
            ;;
    esac
done

before="$(du -sh target 2>/dev/null | cut -f1 || echo "0B")"
echo "target/ before: $before"

case "$MODE" in
    all)
        cargo clean
        ;;
    release)
        cargo clean --release || true
        ;;
    dev)
        cargo clean --profile dev || true
        cargo clean --profile test || true
        rm -rf target/debug/incremental
        rm -rf target/*/debug/incremental
        # Target-specific debug artifacts (e.g. aarch64-apple-darwin/debug).
        rm -rf target/*/debug
        ;;
esac

after="$(du -sh target 2>/dev/null | cut -f1 || echo "0B")"
echo "target/ after:  $after"
