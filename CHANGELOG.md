# Changelog

All notable changes to Streaid.

Historical note:
- **0.0.1–0.4.1** — Electron releases (tagged).
- **0.5.0** — Tauri 2 + React/Vite rewrite (`develop`, untagged).
- **0.6.0** — gpui rewrite (`gpui` branch, untagged).
- **0.7.0** — SwiftUI + Rust core monorepo (`feature/native`).

## [Unreleased]

### Changed

- Updated Rust dependencies: axum 0.8, reqwest 0.13, keyring 4, rodio 0.23,
  tokio-tungstenite 0.30, twitch_oauth2 0.17, dirs 7 and open 5.
- Added `AudioToolbox` to the macOS linker flags for rodio 0.23.

## [0.7.0] - 2026-11-23

### Added

- Native SwiftUI macOS frontend on a UI-agnostic Rust core.
- `crates/streaid-core` and `crates/streaid-ffi` (C ABI + JSON) workspace.
- IRC tag parsing (display name, color, badges, permissions, timestamp) and
  raid (`USERNOTICE`) events.
- Chatters and raiders tracking, desktop notifications, and `chatter` / `chat` /
  `raid` notification sounds.
- Custom commands with `broadcaster` / `mod` / `vip` / `everyone` permissions,
  `!dice`, and a management UI.
- User memos (username / nickname / memo) with CRUD UI.
- Shoutouts: `!so`, `!so user info`, `!so user clip`, `!stop`, and list buttons.
- Minimal read-only Twitch Helix client (users / channels / clips) using the
  existing token, without additional scopes.
- `/alert` OBS overlay for shoutout profile cards and Twitch clips
  (`http://localhost:4242/alert`).
- Japanese / English UI with runtime language switching (`L10n`).
- Discord Webhook: post `!d` lookups as embeds.
- Settings for shoutout templates, alert duration, language, and Discord.
- XCUITest smoke tests for English and Japanese login screens.
- `scripts/build-macos-app.sh` and `scripts/package-macos.sh` (`.app` + DMG,
  optional Developer ID signing and notarization).

### Changed

- Migrated the macOS UI from gpui to SwiftUI.
- App data unified under `~/Library/Application Support/im.sush.streaid`.
- Existing `first` / `remaining` sound slots are read as `chatter` / `chat`.
- Bonsai child processes are stopped on app termination.
- Version bumped to 0.7.0.

### Removed

- gpui / gpui-component frontend and dependencies.
- Legacy Tauri IPC reference moved to `docs/legacy/` for historical reference.

## [0.6.0] - 2026-09-12 (untagged)

### Added

- Native gpui frontend replacing Tauri/React.
- Release `.app` / `.dmg` packaging via cargo-packager.
- Vocabulary tracking with AI inflection analysis.

### Changed

- The app now quits when the last window is closed.

### Fixed

- Responsive layout and content-width overflow.

## [0.5.0] - 2026-09-03 (untagged)

### Added

- Tauri 2 + React/Vite/Tailwind rewrite with routed pages and persistent logs.
- Twitch OAuth device flow, client ID management, and proactive token refresh.
- `!ts` translation and `!d` dictionary via Gemini.
- Chat notification sounds with per-slot volume.
- OBS Browser Source overlay served by an embedded HTTP server.
- Local Bonsai provider via llama-server, 4B/8B switching, Model Test, and a
  Gemini vs local model comparison UI.
- Gemini rate limiting, 429 fallback to the local model, prompt compression, and
  per-command call auditing.
- Credits page with a dependency/license audit.

### Changed

- Non-secret data moved to disk.
- Gemini model switched to 3.1 Flash Lite.

### Fixed

- Auto-reconnect for Twitch IRC and listener freeze prevention.

## [0.4.1] - 2022-10-09

### Added

- English → English dictionary command (`!e2e`).
- About panel.
- GitHub Actions release workflow.

### Changed

- Windows runner build flags.

## [0.4.0] - 2022-05-12

### Changed

- Renamed the application to **Streaid**.
- Optimized the Japanese dictionary database.
- Replaced CSS modules with styled-components.
- Updated packages and dependencies.

## [0.3.2] - 2022-02-28

### Fixed

- Dependency/build fixes for the packaged application.

## [0.3.1] - 2022-02-27

### Added

- Japanese → English dictionary command (`!j2e`).

### Changed

- Reverted to the original tmi.js with patch files and updated minor library
  versions.

## [0.3.0] - 2021-12-12

### Changed

- Updated dependencies, libraries, and the Rollup configuration.
- Raid events now expose username and display name separately.

### Fixed

- Sign-out issue.
- Dependency issues.

## [0.2.1] - 2021-08-22

### Fixed

- Word dictionary lookup.

## [0.2.0] - 2021-08-09

### Added

- Automatic Discord posting of consulted dictionary words.
- Updated license list.

## [0.1.2] - 2021-08-02

### Added

- Version check and update notification.

## [0.1.1] - 2021-07-30

### Fixed

- Memory leak.
- Version/metadata updates.

## [0.1.0] - 2021-06-14

### Added

- `!ts` translation command (DeepL).
- English → Japanese dictionary command (`!e2j`).
- Translation command settings page.
- Dictionary search counter.
- Command handler userstate support.
- Updated license list.

## [0.0.6] - 2021-05-10

### Added

- Custom command function.

### Changed

- Type/interface cleanup.
- Recreated the license list.

## [0.0.5] - 2021-05-02

### Added

- Socket.IO alert server.
- Shoutout alert improvements.
- Shoutout option menu.
- Layout updates.

## [0.0.4] - 2021-04-23

### Added

- User memo.
- Sound playback for every chat message.
- Dark mode.
- Shoutout alert and shoutout clip.
- Overlay support.
- Layout and window-size updates.

## [0.0.3] - 2021-03-02

### Added

- Application menu and window title.
- License list and LICENSE file.
- Version update.

## [0.0.2] - 2021-02-28

### Fixed

- package.json and lint configuration cleanup.

## [0.0.1] - 2021-02-28

### Added

- Initial Electron + React desktop app.
- Twitch chat bot foundations, including chatter/raider/host tracking.
- Desktop notifications and notification sounds.
- Channel information display.
- Shoutout button and command.
- NeDB storage and SQLite dictionary groundwork.
