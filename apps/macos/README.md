# macOS (SwiftUI) frontend

Native SwiftUI frontend. The Rust core is consumed through the C ABI in
`crates/streaid-ffi` (static library).

## Current pieces

```
apps/macos/
├── Streaid/Bridge/
│   ├── StreaidCore.swift     # async wrapper over the C ABI
│   └── StreaidModels.swift   # Codable mirrors of the core JSON types
├── ContractTests/
│   ├── ContractTest.swift    # decoding + live C ABI tests
│   └── main.swift
└── README.md
```

## SwiftUI app (first pass)

`Streaid.xcodeproj` (generated from `project.yml` with XcodeGen) contains:

- `App/StreaidApp.swift` — app entry + root routing
- `App/AppState.swift` — `@MainActor` view model (auth, chat, sounds, events)
- `Views/LoginView.swift`, `ShellView.swift`, `DashboardView.swift`
- `Views/ChattersView.swift`, `RaidersView.swift`, `CommandsView.swift`,
  `UserMemoView.swift`
- `Views/ConfigView.swift`, `ModelTestView.swift`, `LogView.swift`,
  `VocabularyView.swift`, `CreditsView.swift`
- `Theme/Theme.swift` + `Views/Components/` — palette and widgets

## Build & test

```bash
scripts/build-core.sh          # dist/macos/libstreaid_ffi.a + StreaidFFI/module.modulemap
scripts/test-ffi-swift.sh      # compile + run the contract test

# Regenerate the Xcode project after editing project.yml
cd apps/macos && xcodegen generate

# One-shot CLI build (+ ad-hoc sign), place the app in dist/macos/Streaid.app
scripts/build-macos-app.sh
scripts/build-macos-app.sh --debug
scripts/build-macos-app.sh --open      # build and launch

# Or build with xcodebuild directly
xcodebuild -project apps/macos/Streaid.xcodeproj -scheme Streaid \
  -configuration Debug -derivedDataPath /tmp/streaid-derived build

# UI smoke test (login screen renders without Keychain/overlay)
xcodebuild test -project apps/macos/Streaid.xcodeproj -scheme Streaid \
  -destination 'platform=macOS' -derivedDataPath /tmp/streaid-uitest \
  CODE_SIGN_IDENTITY="-" CODE_SIGNING_REQUIRED=NO
```

The Xcode target has a pre-build script that runs `scripts/build-core.sh`, so
the Rust static library is always up to date. Run the app from Xcode (⌘R).

### UI smoke test without Keychain

```bash
STREAID_SKIP_AUTH=1 STREAID_DISABLE_BACKGROUND=1 \
  /tmp/streaid-derived/Build/Products/Debug/Streaid.app/Contents/MacOS/Streaid
```

`STREAID_SKIP_AUTH=1` keeps the app on the login screen and skips Keychain
access; `STREAID_DISABLE_BACKGROUND=1` skips the overlay server and token
refresh. `STREAID_FORCE_LOCALE=ja` forces the Japanese UI for screenshots and
UI tests. `STREAID_DEMO=1` opens the dashboard with populated sample data
(useful for screenshots and UI work).

The target builds **arm64 only** (`ARCHS: arm64`). Intel support is
intentionally not provided.

## Xcode setup

1. Add `libstreaid_ffi.a` to *Link Binary With Libraries*
   (or link `dist/macos/libstreaid_ffi.a` explicitly).
2. Add the module search path: `$(SRCROOT)/../../dist/macos`
   (`SWIFT_INCLUDE_PATHS` / `HEADER_SEARCH_PATHS`), so `import StreaidFFI` resolves.
3. Add linker flags:
   `-framework AudioUnit -framework AudioToolbox -framework CoreAudio
    -framework SystemConfiguration -framework Security -framework CoreFoundation -liconv`.
4. Set `MACOSX_DEPLOYMENT_TARGET` to match `scripts/build-core.sh` (default 13.0).
5. At launch, create one `StreaidCore()` on the main thread and keep it in
   your `@Observable` app state.

```swift
@MainActor
@Observable
final class AppState {
    let core = StreaidCore()
    var status: ChatStatus?
    private var pump: Task<Void, Never>?

    func start() {
        pump = Task {
            for await batch in core.eventStream() {
                for event in batch {
                    switch event {
                    case .translation(let value): translations.insert(value, at: 0)
                    case .dictionary(let value): lookups.insert(value, at: 0)
                    case .chatMessage(let value): playSoundIfNeeded(value)
                    case .unknown: break
                    }
                }
            }
        }
    }
}
```

See `docs/ffi.md` for the full method reference and `docs/native-ui-migration.md`
for the migration plan.
