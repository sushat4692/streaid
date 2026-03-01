# streaid-tauri — Copilot 用プロジェクト解析メモ

以下はリポジトリを素早く理解して作業を始めるための要点メモです。開発者や AI エージェント向けに、実行・ビルド手順、主要ファイル、Twitch 統合の候補箇所をまとめています。

## プロジェクト概要
- このリポジトリは Tauri + React（Vite）で作られたデスクトップアプリケーションのテンプレートに、配信（Twitch）向けの機能を追加する目的のプロジェクトです。
- フロントエンド: React + Vite（`src/`）
- バックエンド（ネイティブ）: Rust + Tauri（`src-tauri/`）

## 重要なファイルとエントリポイント
- フロントエンド
  - `index.html` — Vite のエントリ HTML
  - `src/main.tsx` — React アプリのエントリポイント
  - `src/App.tsx` — サンプルコンポーネント（現状: Tauri の `greet` コマンド呼び出しを行う）
  - `package.json` — 開発スクリプト、依存関係（`pnpm` 想定）

- Tauri / Rust
  - `src-tauri/Cargo.toml` — Rust 側の依存とビルド設定
  - `src-tauri/src/main.rs` — 小さなバイナリ `main`（`streaid_tauri_lib::run()` を呼ぶ）
  - `src-tauri/src/lib.rs` — ライブラリ側で Tauri のランタイムを組み立てている（このファイルを拡張することが多い）
  - `src-tauri/tauri.conf.json` — Tauri ビルド/バンドル設定（dev URL、アイコン、ビルド前コマンドなど）

## 開発・ビルド・実行手順（ローカル）
- 前提: Node（pnpm が推奨）、Rust と Tauri CLI がインストールされていること。
- フロントエンド開発サーバ起動:

```bash
pnpm install
pnpm dev
```

- Tauri アプリの開発実行（GUI でデスクトップ実行するには別ターミナルで）:

```bash
pnpm tauri dev
```

- ビルド（配布用）:

```bash
pnpm build
pnpm tauri build
```

注意: `tauri.conf.json` の `build.devUrl` は `http://localhost:1420` になっています。Vite のデフォルトポートが異なる場合は `package.json` と `vite.config.ts` の設定を確認してください。

## 現状の機能と実装箇所
- 現在 React 側サンプルでは `invoke("greet", { name })` を呼び、Rust 側で応答するサンプル実装が想定されます。
- ネイティブ側のロジックは `src-tauri/src/lib.rs` に集約されることが一般的です。配信関連の永続接続や認証トークンの保管などは Rust 側で実装しても良いし、簡易な HTTP/WS クライアントはフロントエンド側（JS）で実装しても良いです。

## Twitch 統合の候補と設計案
- 認証
  - デスクトップアプリの場合、Twitch の Device Code Grant（デバイスコードフロー）を推奨します。理由: ネイティブアプリでリダイレクト URI の管理や組み込みブラウザを避けられ、ユーザーが別デバイスで認可操作を行えるため、実装とユーザー体験がシンプルになります。
  - 実装メモ:
    - フロー: クライアントIDとスコープで `https://id.twitch.tv/oauth2/device/code` に POST し、`device_code`, `user_code`, `verification_uri`, `expires_in`, `interval` を取得します。UIで `user_code` と `verification_uri`（または `verification_uri_complete`）を表示し、必要に応じてシステムブラウザで開きます（`tauri-plugin-opener` を利用可能）。
    - トークン取得: サーバの指定する `interval` 毎に `https://id.twitch.tv/oauth2/token` をポーリングします。レスポンスで `authorization_pending`、`slow_down`、成功時のアクセストークンとリフレッシュトークンの取り扱いを実装してください。
    - トークンの保管: OS のキーチェーン（Rust で `keyring` 等）または Tauri の安全なストレージで暗号化して保存します。アクセストークンは短期管理、リフレッシュトークンは安全に保管しておくと良いです。
    - トークン刷新: リフレッシュトークンを使ったトークン更新ロジック（`/oauth2/token` へのリフレッシュリクエスト）を実装し、期限切れや失効時の再認証フローを用意してください。
    - セキュリティ: Device Flow は公開クライアント向けでクライアントシークレットを不要とするため、デスクトップ配布に向きます。クライアントシークレットは埋め込まないでください。
    - 実装場所の推奨: セキュリティ重視なら認証とトークン管理を Rust 側で行い、フロントエンドは表示と状態反映に専念する設計が堅牢です。小さなプロトタイプはフロントエンド側で試験できます。
    - 参考エンドポイント: `https://id.twitch.tv/oauth2/device/code` と `https://id.twitch.tv/oauth2/token`。Twitch の公式ドキュメントを参照してください。

- イベント受信（チャット・チップ・フォロー等）
  - Twitch の PubSub または IRC（Twitch Chat）を使う。長時間接続・再接続ロジックが必要。
  - 再接続やトークン更新は Rust 側で実装すると堅牢。React は表示/通知に専念。

- 配信操作（配信タイトル更新、クリップ作成等）
  - Twitch API 呼び出しを行うエンドポイントをネイティブ側に作り、フロントから `invoke` する設計が安全で分かりやすい。

- 設計上の判断基準
  - セキュリティ重視（トークン管理、Webhook シークレット）→ Rust 側
  - UI/即時反応（チャット表示、設定 UI）→ React 側

## 拡張のアイデア
- ステータスバー常駐ウィジェット（配信の状態を表示）
- OBS と連携するための WebSocket ブリッジ（OBS WebSocket）
- カスタムアクション（チャットコマンドでローカルスクリプト実行）
- プラグイン化（`capabilities/` にスキーマがあり、拡張ポイントが将来あることを想定）

## 開発時の注意点
- 依存バージョン: `@tauri-apps/api` と `@tauri-apps/cli` のメジャーが 2 系なので、Tauri 2 のドキュメントを参照してください。
- macOS の notarization やサンドボックス要件はリリース時に必要になる可能性があります。

## 参照先（最初に見るべき場所）
- フロントエンドのエントリ: `src/main.tsx`
- アプリ UI の開始点: `src/App.tsx`
- ネイティブ側の起点: `src-tauri/src/lib.rs` と `src-tauri/src/main.rs`
- ビルド設定: `tauri.conf.json`, `package.json`, `Cargo.toml`

----
このファイルは AI エージェントや新しい貢献者が素早くリポジトリを理解して作業できるよう作成しました。Twitch 機能の優先実装や分割（どちらを Rust/JS に置くか）について追加の方針が必要なら指示ください。
