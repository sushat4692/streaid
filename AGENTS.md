# Agent Guide for Streaid Tauri

A Tauri desktop application that supports Japanese-English translation in Twitch chat.

## Project Overview

- **Name**: streaid-tauri
- **Version**: 0.1.0
- **Stack**: React 19 + TypeScript + Tauri 2 + Rust
- **Purpose**: Twitch chat translation support (Japanese ↔ English)

## Build, Lint & Test Commands

### Frontend (TypeScript/React)

```bash
# Development
pnpm dev                    # Start Vite dev server (port 1420)
pnpm tauri dev              # Launch Tauri app with hot reload

# Build
pnpm build                  # TypeScript compile + Vite build
pnpm tauri build            # Build production Tauri app

# Code Quality
pnpm lint                   # Run oxlint on src/
pnpm lint:fix               # Auto-fix linting issues
pnpm format                 # Format code with oxfmt
pnpm format:check           # Check formatting without writing
```

### Backend (Rust/Tauri)

```bash
cd src-tauri

# Test
cargo test                  # Run all tests
cargo test test_name        # Run specific test matching "test_name"
cargo test --no-run         # Compile tests without running
cargo test -- --nocapture   # Show println! output during tests

# Build & Check
cargo build                 # Build debug version
cargo build --release       # Build release version
cargo check                 # Fast compilation check
cargo clippy                # Rust linter
cargo fmt                   # Format Rust code
cargo fmt --check           # Check formatting
```

## Code Style Guidelines

### TypeScript/React

#### Import Order
```typescript
// 1. External libraries
import { invoke } from '@tauri-apps/api/core'
import { useState, useEffect } from 'react'
import cx from 'classnames'

// 2. Internal components
import Button from './components/Button'
import Field from './components/Field'
```

#### Component Structure
- Use **functional components** with React 19 hooks
- Use **named exports** for utilities, **default exports** for components
- Type props with `type Props = { ... }`
- Use `cx` (classnames) for conditional styling

#### Naming Conventions
- Components: PascalCase (`Button.tsx`, `AuthCard.tsx`)
- Files: Match component name
- Functions: camelCase (`startDeviceFlow`, `saveClientId`)
- Types: PascalCase (`TokenInfo`, `DeviceCodeInfo`)
- Constants: camelCase or UPPER_SNAKE_CASE for true constants

#### TypeScript Types
- Prefer `type` over `interface` for component props
- Use strict mode (enabled in `tsconfig.json`)
- Avoid `any` - use proper types or `unknown` if necessary
- Use `as` assertions sparingly, prefer type guards

#### Styling
- **Tailwind CSS v4** with `@import 'tailwindcss'` in `index.css`
- Use Tailwind utility classes directly in JSX
- Group related utilities: layout → spacing → typography → colors → effects
- Use `cx` for conditional classes

### Rust/Tauri

#### Module Organization
```rust
// Module declarations at top
mod auth;

// Imports grouped by source
use auth::{poll_device_flow, shared_state, DeviceCodeInfo};
use once_cell::sync::Lazy;
use std::sync::Arc;
use std::time::Duration;
```

#### Naming Conventions
- Files: snake_case (`auth.rs`, `lib.rs`)
- Functions: snake_case (`start_device_flow`, `poll_device_flow_cmd`)
- Types/Structs: PascalCase (`TokenInfo`, `InnerState`)
- Constants: UPPER_SNAKE_CASE (`AUTH_STATE`)
- Tauri commands: suffix with `_cmd` (`start_device_flow_cmd`)

#### Error Handling
- Use `anyhow::Result<T>` for functions returning errors
- Use `.context("descriptive message")` to add context to errors
- For Tauri commands, return `Result<T, String>` and format errors:
  ```rust
  .map_err(|e| format!("operation failed: {}", e))
  ```
- Log errors with `eprintln!` for debugging

#### Async/Concurrency
- Use `tokio` runtime (imported via Tauri)
- Mark async functions with `async` keyword
- Use `.await` for async operations
- Use `Arc<Mutex<T>>` for shared state across threads

#### Serialization
- Derive `Serialize` and `Deserialize` for types exposed to frontend
- Use `#[derive(Debug, Serialize, Deserialize, Clone)]` pattern
- Use `serde_json` for JSON handling

#### Tauri Commands
```rust
#[tauri::command]
async fn my_command_cmd(param: String) -> Result<ReturnType, String> {
    // Implementation
    Ok(result)
}
```

## Tauri Commands (Frontend ↔ Backend)

### Available Commands

| Command | Arguments | Return | Description |
|---------|-----------|--------|-------------|
| `greet` | `name: string` | `string` | Test greeting |
| `start_device_flow_cmd` | `clientId: string, scopes: string[]` | `DeviceCodeInfo` | Start OAuth device flow |
| `poll_device_flow_cmd` | - | `TokenInfo \| null` | Poll for auth completion |
| `get_stored_token_cmd` | - | `TokenInfo \| null` | Get stored token from keyring |
| `clear_stored_token_cmd` | - | `void` | Delete stored token |
| `refresh_token_cmd` | - | `TokenInfo \| null` | Refresh access token |
| `open_url_cmd` | `url: string` | `void` | Open URL in system browser |
| `debug_token_status` | - | `DebugTokenStatus` | Debug token state |
| `set_client_id_cmd` | `clientId: string` | `void` | Save client ID to disk |
| `get_client_id_cmd` | - | `string \| null` | Load client ID from disk |
| **`set_gemini_api_key_cmd`** | `apiKey: string` | `void` | **Save Gemini API key to keyring** |
| **`get_gemini_api_key_cmd`** | - | `string \| null` | **Get masked API key** |
| **`start_chat_listener_cmd`** | `targetChannel?: string` | `void` | **Start Twitch IRC chat listener** |
| **`stop_chat_listener_cmd`** | - | `void` | **Stop chat listener** |
| **`get_chat_status_cmd`** | - | `ChatStatus` | **Get listener status** |
| **`toggle_translation_cmd`** | `enabled: bool` | `void` | **Enable/disable !ts command** |

**Note on `start_chat_listener_cmd`:**
- `targetChannel` (optional): Twitch channel name to monitor. If omitted or empty, monitors authenticated user's own channel.
  - Automatically sanitized: lowercased, `#` prefix removed, whitespace trimmed
  - Examples: `"xqc"`, `"shroud"`, `"pokimane"`
  - Validation: alphanumeric + underscore only, max 25 chars

### Calling from Frontend
```typescript
import { invoke } from '@tauri-apps/api/core'

// Example
const result = await invoke('start_device_flow_cmd', {
  clientId,
  scopes: ['chat:read', 'chat:edit']  // Updated scopes
})
```

### Tauri Events (Backend → Frontend)

Listen to real-time events from backend:

```typescript
import { listen } from '@tauri-apps/api/event'

// Listen for translation events
useEffect(() => {
  const unlisten = listen<TranslationEvent>('translation', (event) => {
    console.log('Translation:', event.payload)
  })
  
  return () => { unlisten.then(f => f()) }
}, [])
```

**Available Events:**
- `translation`: Emitted when a message is translated (see `TranslationEvent` type)

## Directory Structure

```
streaid-tauri/
├── src/                          # Frontend (TypeScript/React)
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Main component
│   ├── index.css                 # Tailwind imports + globals
│   ├── components/               # Reusable UI components
│   │   ├── TranslationSettings.tsx  # Gemini API key config
│   │   ├── ChatControl.tsx          # Start/stop listener
│   │   └── TranslationLog.tsx       # Real-time translation log
│   ├── types/
│   │   └── chat.ts               # Chat-related TypeScript types
│   └── routes/                   # TanStack Router routes
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── main.rs               # Tauri entry point
│   │   ├── lib.rs                # Command definitions
│   │   ├── auth.rs               # OAuth logic
│   │   ├── chat.rs               # IRC WebSocket connection
│   │   └── translate.rs          # Gemini API translation
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── package.json                  # Frontend dependencies
└── vite.config.ts                # Vite + plugins config
```

## Key Technologies

- **Linter**: oxlint (faster than ESLint)
- **Formatter**: oxfmt (frontend), cargo fmt (backend)
- **Router**: TanStack Router with file-based routing
- **Styling**: Tailwind CSS v4
- **UI**: @base-ui/react for base components
- **OAuth**: twitch_oauth2 + twitch_api crates
- **Storage**: OS keyring for secure credential storage
- **Chat**: Twitch IRC WebSocket via tokio-tungstenite
- **Translation**: Gemini 1.5 Flash API (Google AI, free tier supported) with auto language detection (Japanese ↔ English)

## Best Practices

1. **State Management**: Use React hooks; shared Rust state via `Arc<Mutex<T>>`
2. **Error Handling**: Always provide context; log for debugging
3. **Async Operations**: Mark functions `async`, use `.await` consistently
4. **Type Safety**: Enable TypeScript strict mode; use Rust's type system
5. **Security**: Store tokens in OS keychain, never in plaintext files
6. **Testing**: Write tests for business logic; use `cargo test test_name` for focused testing
7. **Formatting**: Run formatters before committing (`pnpm format`, `cargo fmt`)

## Common Patterns

### Frontend: Tauri Invoke
```typescript
try {
  const result = await invoke('command_name', { param1, param2 })
  console.log('Success:', result)
} catch (error) {
  console.error('Failed:', error)
}
```

### Backend: Tauri Command
```rust
#[tauri::command]
async fn command_name(param: String) -> Result<ReturnType, String> {
    operation()
        .await
        .map_err(|e| format!("operation failed: {}", e))
}
```

### Shared State Pattern
```rust
static STATE: Lazy<Arc<Mutex<StateType>>> = Lazy::new(|| Arc::new(Mutex::new(StateType::new())));

fn get_state() -> Arc<Mutex<StateType>> {
    STATE.clone()
}
```
