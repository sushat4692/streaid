# streaid-tauri — Copilot 用プロジェクト解析メモ（更新）

以下は現在のリポジトリ状態を素早く理解して作業を始めるための要点メモです。

## プロジェクト概要
- このリポジトリは Tauri + React（Vite）で作られたデスクトップアプリケーションです。Twitch の Device Code Grant 認証を含む配信向け機能をネイティブ（Rust）で実装する設計です。
- フロントエンド: React + Vite（`src/`）。UI ライブラリとして `@base-ui/react`（Base UI）を使用しています（コンポーネント群は `src/components/` にまとまっています）。
- バックエンド（ネイティブ）: Rust + Tauri（`src-tauri/`） — 認証、トークン管理、バックグラウンドのトークン更新ロジックを実装。

## 重要なファイルとエントリポイント（現在）
- フロントエンド
  - `index.html` — Vite エントリ
  - `src/main.tsx` — React のエントリポイント（`index.css` を読み込み）
  - `src/index.css` — Tailwind を使い、`@layer base`/`@layer components` にルート・レイアウトルールを定義（`App.css` は削除されました）
  - `src/App.tsx` — 簡素な UI（`Client ID` 入力、`Save`、`Start Device Flow`）
  - `src/components/` — 再利用コンポーネント（`Layout`, `Button`, `Field`, `StatusBadge` 等）
  - `package.json` — スクリプト/依存（`pnpm` 前提）。Tailwind v4 + `@tailwindcss/vite` を使用しています。

- Tauri / Rust
  - `src-tauri/Cargo.toml` — Rust 依存（`twitch_oauth2`, `reqwest`, `keyring`, `once_cell` 等）
  - `src-tauri/src/lib.rs` — Tauri のコマンドを公開（認証コマンド含む）、`tauri_plugin_opener` を登録、バックグラウンドで `refresh_token_if_needed` を定期実行しています。
  - `src-tauri/src/auth.rs` — Device Code フロー、単発ポーリング、トークン永続化（OS キーチェーン via `keyring`）、トークンリフレッシュロジックを実装。
  - `src-tauri/tauri.conf.json` — Tauri ビルド設定

## 実行・ビルド手順（ローカル）
- 前提: Node (pnpm 推奨), Rust と Tauri CLI

フロントエンド開発サーバ:
```bash
pnpm install
pnpm dev
```

Tauri アプリ開発（別ターミナルで）:
```bash
pnpm tauri dev
```

プロダクションビルド:
```bash
pnpm build
pnpm tauri build
```

## 現在公開されている Tauri コマンド
- `greet(name: &str)`
- `start_device_flow_cmd(client_id, scopes)` → Rust 側で `device_code` を取得して共有状態に保存、`DeviceCodeInfo` を返す
- `poll_device_flow_cmd()` → 単発でトークン取得を試みる（成功時は `TokenInfo` を返し、state の `last_device_code` をクリア）
- `get_stored_token_cmd()` / `clear_stored_token_cmd()` → OS キーチェーンからの読み取り・削除
- `refresh_token_cmd()` → リフレッシュトークンでアクセストークンを更新
- `open_url_cmd()` → `open` クレートで OS デフォルトブラウザを開く
- `debug_token_status()` → デバッグ用（device_code や keyring の有無を返す）
- `set_client_id_cmd()` / `get_client_id_cmd()` → `~/.config/streaid/client_id` 相当へ保存/読み込み

## Rust 側の実装要点（`src-tauri/src/auth.rs`）
- `start_device_flow`:
  - Twitch の Device Code エンドポイントに POST して `device_code`, `user_code`, `verification_uri`, `interval`, `expires_in` を取得。
  - `InnerState` に `last_device_code` / `client_id` / `interval` / `expires_at` を保存。
- `poll_device_flow`:
  - 共有状態から `device_code` と `client_id` を取り出し、単発で `/oauth2/token` を叩く（フロントはこのコマンドを繰り返し呼ぶ必要があるが、現在の設計ではバックグラウンド刷新や自動ポーリングは Rust 側で扱うことが多い）。
  - 成功時は `access_token` を OS キーチェーンへ保存し、`last_device_code` をクリア。
  - `authorization_pending` / `slow_down` / `expired_token` 等のレスポンスを扱う。
- `refresh_token` / `refresh_token_if_needed`:
  - keyring に保存されたリフレッシュトークンで `/oauth2/token` を叩き、トークンを更新して keyring を上書き。
  - アプリ起動時に Tauri の非同期ランタイムで `refresh_token_if_needed` を定期実行するワーカを起動（現在は30秒間隔でチェック）。

## フロントエンドの現状
- `App.css` は削除済み。グローバルなリセットやルールは `src/index.css` の Tailwind `@layer` に移行済み。
- `src/components` に小さい UI コンポーネントを保持しています。

### コード整形 / Lint
- このプロジェクトは `ox` エコシステムのツールを使用しています。`package.json` のスクリプト:

```bash
pnpm run format       # oxfmt src
pnpm run format:check # oxfmt --check src
pnpm run lint         # oxlint src
pnpm run lint:fix     # oxlint --fix src
```

`oxfmt` / `oxlint` は `devDependencies` に含まれており、コードフォーマットと静的解析を担当します。

## セキュリティと運用上の注意
- トークンは OS のキーチェーン（`keyring`）へ保存されています。キー名は `streaid` スコープで `twitch_access_token` / `twitch_refresh_token` を使用。
- Device Flow は公開クライアント向けのフローです。クライアントシークレットをアプリに埋め込まないでください。

## 開発の次の一手（候補）
- フロントエンド: ログをアプリ内で確認できる "ログビューア" を追加するとデバッグは楽になります。
- UX: Client ID を入力せずにデフォルトのクライアント ID を使えるようにする（開発用）か、設定画面に移す。
- テスト: Device Flow の E2E をローカルで手動検証して、`poll_device_flow_cmd` とバックグラウンド更新の連携を確認してください。

----
このファイルは、コントリビュータや自動エージェントが素早く現状を理解して安全に作業できるように更新しました。さらに詳しい実装や設計方針が必要なら指示ください。