# Changelog

## [0.7.0] - 2026-11-23

### Added

- Native SwiftUI macOS app replacing the gpui frontend.
- `crates/streaid-core` (UI-agnostic Rust core) and `crates/streaid-ffi` (C ABI + JSON).
- IRC tag parsing (display name, badges, permissions, timestamps) and raid (`USERNOTICE`) events.
- Chatters / Raiders tracking with desktop notifications and `chatter` / `chat` / `raid` sounds.
- Custom commands with broadcaster/mod/vip/everyone permissions, `!dice`, and a management UI.
- User memos (username / nickname / memo).
- Shoutouts: `!so`, `!so user info`, `!so user clip`, `!stop`, plus list buttons.
- `/alert` OBS overlay for shoutout info cards and Twitch clips (`:4242/alert`).
- Minimal read-only Twitch Helix client (users / channels / clips).
- Japanese / English UI with runtime language switching (`L10n`).
- Discord Webhook: post `!d` lookups as embeds.
- Settings UI for shoutout templates, alert duration, language, Discord webhook.
- XCUITest smoke tests for the English and Japanese login screens.
- `scripts/build-macos-app.sh` and `scripts/package-macos.sh` (`.app` + DMG, optional notarization).

### Changed

- App data unified under `~/Library/Application Support/im.sush.streaid`.
- Existing `first` / `remaining` sound slots are read as `chatter` / `chat`.
- Bonsai child processes are stopped on app termination.
- Version bumped to 0.7.0.

### Removed

- gpui / gpui-component frontend and dependencies.
- Windows WinUI 3 scaffold (outlook kept in `docs/future.md`).
- Legacy Tauri IPC reference moved to `docs/legacy/`.
