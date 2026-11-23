# Packaging

Per-platform packaging assets. Build outputs are gitignored.

```
packaging/
└── macos/      # entitlements, notarization notes, DMG layout
```

## macOS

The SwiftUI app is packaged by `scripts/package-macos.sh`:

```bash
scripts/package-macos.sh
# -> dist/macos/Streaid.app
# -> dist/macos/Streaid-<version>.dmg

# Developer ID + notarization
DEVELOPER_ID="Developer ID Application: ..." \
  NOTARY_PROFILE="streaid-notary" \
  scripts/package-macos.sh
```


Planned files:

- `macos/Streaid.entitlements` — network client, user-selected files, keychain
- `macos/dmg.json` — DMG layout (currently plain `hdiutil`).

Windows packaging is not implemented. See `docs/future.md` for the deferred
outlook.
