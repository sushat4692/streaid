# Future Outlook

This repository is macOS-only right now. This file records directions that were
considered but are intentionally **not implemented** yet, so the current macOS
work can evolve without keeping platform-specific scaffolding around.

## Windows (deferred)

Windows support is a possible future direction, but no Windows code is
maintained in this repository.

**Why it is feasible**

- `crates/streaid-core` is UI-agnostic and cross-platform Rust (tokio, reqwest,
  axum, rodio, keyring).
- `crates/streaid-ffi` exposes a four-function C ABI with UTF-8 JSON:
  `streaid_init` / `streaid_dispatch` / `streaid_poll_events` / `streaid_free`.
- A Windows frontend would build `streaid-ffi` as a `cdylib`
  (`streaid_ffi.dll`) and P/Invoke it from a WinUI 3 / C# app. The contract is
  documented in `docs/ffi.md`.

**Differences to handle when work starts**

| Area | macOS (today) | Windows (future) |
|---|---|---|
| Local model | MLX / Bonsai (macOS-only) | Gemini only, or a different local backend (e.g. llama.cpp) |
| Keychain | macOS Keychain | Windows Credential Manager (`keyring`) |
| Audio | CoreAudio | WASAPI via `rodio`/`cpal` |
| Packaging | Xcode + DMG + notarytool | MSIX + code signing |
| App data | `~/Library/Application Support/im.sush.streaid` | `%APPDATA%\im.sush.streaid` |
| Overlay | axum on `:4242` | unchanged |

**Status**

A C# wrapper, contract-test project, and `build-core.ps1` existed as a scaffold.
They were removed on 2026-11-23 to keep the macOS implementation focused; they
can be recreated from `crates/streaid-ffi` and `docs/ffi.md` when Windows work
actually starts.

**Trigger to start**

Do not start Windows work until the macOS UI/spec has settled and the core/FFI
contract is stable (`system.capabilities.api_version`), so the second frontend
does not have to chase a moving target.
