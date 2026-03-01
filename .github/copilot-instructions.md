# Streaid Tauri Project Instructions

Twitch配信をサポートするTauriデスクトップアプリケーションです。

## プロジェクト概要

- **名前**: streaid-tauri
- **バージョン**: 0.1.0
- **識別子**: im.sush.streaid
- **目的**: Twitch上のチャット欄で日本語 - 英語間の翻訳をサポートするアプリケーション

## 技術スタック

### フロントエンド (TypeScript/React)

| ライブラリ | バージョン | 用途 |
|-----------|----------|------|
| React | ^19.2.3 | UIフレームワーク |
| React DOM | ^19.2.3 | DOMレンダリング |
| @tauri-apps/api | ^2 | Tauriバックエンド通信 |
| @tauri-apps/plugin-opener | ^2 | URL/ファイルオープン |
| @tanstack/react-router | ^1.147.3 | ルーティング |
| @base-ui/react | ^1.0.0 | UIコンポーネント |
| Tailwind CSS | ^4.1.18 | スタイリング |
| Vite | ^7.3.1 | ビルドツール |
| TypeScript | ~5.9.3 | 型システム |

**Linter/Formatter**: oxlint (^1.38.0), oxfmt (^0.23.0)

### バックエンド (Rust/Tauri)

| クレート | バージョン | 用途 |
|---------|----------|------|
| tauri | 2 | デスクトップアプリフレームワーク |
| tauri-plugin-opener | 2 | システムオープナー |
| twitch_oauth2 | 0.16 | Twitch OAuth認証 |
| twitch_api | 0.7 | Twitch API クライアント |
| tokio | 1 | 非同期ランタイム |
| reqwest | 0.11 | HTTPクライアント |
| keyring | 1.1 | OSキーチェーン/認証情報保存 |
| serde/serde_json | 1 | シリアライズ/デシリアライズ |
| anyhow | 1.0 | エラーハンドリング |
| once_cell | 1.18 | 遅延初期化 |
| open | 3 | システムブラウザ起動 |
| dirs | 4 | ディレクトリパス取得 |

## ディレクトリ構造

```
streaid-tauri/
├── src/                          # フロントエンドソース
│   ├── main.tsx                  # エントリーポイント
│   ├── App.tsx                   # メインアプリコンポーネント
│   ├── index.css                 # グローバルスタイル (Tailwind)
│   ├── components/               # 再利用可能なUIコンポーネント
│   │   ├── AuthCard.tsx
│   │   ├── Button.tsx
│   │   ├── Field.tsx
│   │   ├── Input.tsx
│   │   ├── Layout.tsx
│   │   └── StatusBadge.tsx
│   └── assets/                   # 静的アセット
├── src-tauri/                    # Rustバックエンド
│   ├── src/
│   │   ├── main.rs               # Tauriエントリーポイント
│   │   ├── lib.rs                # Tauriコマンド定義
│   │   └── auth.rs               # Twitch OAuth認証ロジック
│   ├── capabilities/             # Tauriパーミッション設定
│   │   └── default.json
│   ├── icons/                    # アプリアイコン
│   ├── tauri.conf.json           # Tauri設定
│   └── Cargo.toml                # Rust依存関係
├── public/                       # 公開静的ファイル
├── index.html                    # HTMLテンプレート
├── vite.config.ts                # Vite設定
├── tailwind.config.cjs           # Tailwind設定
├── tsconfig.json                 # TypeScript設定
└── package.json                  # npm依存関係
```

## Tauriコマンド一覧

フロントエンドから `invoke()` で呼び出し可能なRustコマンド:

| コマンド | 引数 | 戻り値 | 説明 |
|---------|-----|-------|------|
| `greet` | `name: string` | `string` | テスト用挨拶 |
| `start_device_flow_cmd` | `clientId: string, scopes: string[]` | `DeviceCodeInfo` | Device Flow開始 |
| `poll_device_flow_cmd` | なし | `TokenInfo \| null` | 認証ポーリング |
| `get_stored_token_cmd` | なし | `TokenInfo \| null` | 保存済みトークン取得 |
| `clear_stored_token_cmd` | なし | `void` | トークン削除 |
| `refresh_token_cmd` | なし | `TokenInfo \| null` | トークン更新 |
| `open_url_cmd` | `url: string` | `void` | システムブラウザでURL開く |
| `debug_token_status` | なし | `DebugTokenStatus` | デバッグ用ステータス |
| `set_client_id_cmd` | `clientId: string` | `void` | Client ID保存 |
| `get_client_id_cmd` | なし | `string \| null` | Client ID取得 |

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# Tauriアプリとして起動
pnpm tauri dev

# プロダクションビルド
pnpm build
pnpm tauri build

# Lint
pnpm lint
pnpm lint:fix

# フォーマット
pnpm format
pnpm format:check
```

## 認証フロー

1. ユーザーがClient IDを入力して保存
2. 「Start Device Flow」でTwitch Device Flow開始
3. バックエンドがdevice_codeとverification_uriを取得
4. システムブラウザでverification_uriを自動オープン
5. バックエンドがポーリングで認証完了を監視
6. 認証成功後、トークンをOSキーチェーンに保存
7. バックグラウンドタスクで30秒ごとにトークン更新をチェック

## コーディング規約

- **フロントエンド**: React 19のフック、関数コンポーネント使用
- **スタイリング**: Tailwind CSS v4 (index.cssで `@import 'tailwindcss'`)
- **Linter**: oxlint (ESLintより高速)
- **Formatter**: oxfmt
- **Rust**: Tauri v2のコマンドシステム、anyhowでエラーハンドリング
