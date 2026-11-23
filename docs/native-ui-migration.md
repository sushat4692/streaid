# gpui → SwiftUI 移行の記録と残タスク

状態: **gpui 版は削除済み。SwiftUI が唯一の macOS UI。**
Windows は将来の選択肢だが、コードは置かず `docs/future.md` に展望だけ記録している。

---

## 1. 結論

- モノレポ化・コア抽出・C ABI 実装・SwiftUI 全画面の初版まで完了。
- `crates/streaid-core` は UI 非依存。`crates/streaid-ffi` が唯一の境界。
- gpui / gpui-component への依存は `Cargo.toml` から削除済み（依存クレート 886 → 367）。
- Intel 対応は行わない（arm64 のみ）。

---

## 2. 実施内容

- `app/` の gpui アプリから、UI 以外を `crates/streaid-core` に抽出。
- `crates/streaid-ffi` を新設（`streaid_init` / `dispatch` / `poll_events` / `free`）。
- Swift ラッパ `StreaidCore.swift` + `Codable` モデルを追加。
- SwiftUI アプリ `apps/macos` を追加（Login / Shell / Dashboard / Config /
  Model Test / Log / Vocabulary / Credits）。
- データディレクトリを `~/Library/Application Support/im.sush.streaid` に統一。
- `auth::shared_state()` をプロセス共有に修正（start / poll を別呼び出しで扱うため）。
- `AppEvent` / `SoundFile` を JSON シリアライズ可能に。
- `auth.status` / `auth.device_flow_interval` / `chat.last_channel` などの FFI を追加。
- `NSApplicationDelegate` で終了時に Bonsai を停止、最後のウィンドウで終了。
- gpui 版と `apps/gpui`、gpui 依存、`scripts/build-app.sh` を削除。
- Windows スキャフォールド（C# ラッパ / 契約テスト / `build-core.ps1`）を削除。

### 検証結果

```
$ cargo test --workspace
  streaid-core ... 33 passed; 0 failed; 3 ignored
  streaid-ffi  ...  8 passed; 0 failed
$ cargo clippy --workspace --all-targets   → 警告なし
$ cargo fmt --all --check                  → OK
$ scripts/test-ffi-swift.sh                → Swift FFI contract test: OK
$ xcodebuild ... Streaid build             → BUILD SUCCEEDED
$ xcodebuild test ... Streaid              → TEST SUCCEEDED（UIスモーク）
$ scripts/package-macos.sh                 → .app + DMG 生成 OK
```

---

## 3. 現在の構成

```
Cargo.toml                     # workspace（core + ffi のみ）
crates/
├── streaid-core/              # UI 非依存
│   └── src/{lib,auth,chat,translate,dictionary,bonsai,sounds,
│            overlay,vocabulary,platform}.rs
└── streaid-ffi/               # C ABI (JSON)
    ├── src/{lib,api}.rs
    └── include/streaid.h
apps/
└── macos/                     # SwiftUI（XcodeGen）
    ├── project.yml
    ├── Streaid/{App,Bridge,Theme,Views,Resources}
    ├── StreaidUITests/
    └── ContractTests/
packaging/                     # macOS 用
scripts/                       # build-core / build-macos-app / package-macos / Bonsai
docs/                          # 開発者向けドキュメント
```

Windows のコードは置かない。将来の展望は `docs/future.md` を参照。

---

## 4. プラットフォーム前提

| 項目 | 現在（macOS） |
|---|---|
| UI | SwiftUI（macOS 13+、arm64） |
| コア接続 | C ABI + JSON（静的ライブラリ） |
| ローカルモデル | MLX / Bonsai（macOS 専用） |
| Keychain | macOS Keychain（service `streaid`） |
| 音声 | CoreAudio（`rodio`） |
| オーバーレイ | axum :4242 |
| アプリデータ | `~/Library/Application Support/im.sush.streaid` |
| 配布 | Xcode + DMG、`notarytool`（任意） |

---

## 5. 残タスク

### P0: 実機受け入れ（ゲート B）

- [ ] Twitch ログイン（デバイスフロー、Keychain 再認証プロンプト）
- [ ] リスナー開始/停止、自動再接続（`RECONNECT` / keepalive）
- [ ] 実チャンネルで `!ts` / `!d` の送信と画面表示
- [ ] 効果音（初回/再訪、音量、ファイル選択）
- [ ] OBS オーバーレイ（:4242、SSE、透明背景）
- [ ] Gemini キーの保存・マスク表示
- [ ] Bonsai の有効化 / 8B・4B 切替 / 停止、モデルテスト
- [ ] 語彙の記録・AI 分析
- [ ] 既存データ（`bonsai/`・`sounds/`・`streaid.log`）が読めること

### P1: リリース前に必須

- [x] 終了時に `core.shutdownSync()` を呼ぶ（Bonsai の子プロセス停止）
- [x] 最後のウィンドウを閉じたら終了
- [x] ログインのキャンセル / タイムアウト / 再試行
- [x] `slow_down` 対応（`auth.device_flow_interval`）
- [x] Keychain エラーの表示（`auth.status`）
- [x] 成功/エラートーストの色分け
- [x] Bonsai 有効化中の進捗表示
- [ ] Bonsai 有効化のキャンセル（コア側のキャンセルトークンが必要）

### P2: UI/UX パリティ

- [ ] 旧 React 版（`9987a76`）との見た目比較・余白調整
- [ ] 日本語 IME（TextField / TextEditor）の確認
- [ ] VoiceOver / キーボードナビゲーション / フォーカス順
- [x] 空状態・ローディング・無効状態の統一（主要画面）
- [x] ウィンドウ最小サイズ・リサイズ
- [x] Bonsai 未有効時の Model Test プロバイダー無効化
- [x] 音量設定の移行（旧 `volumes.json` → `UserDefaults`）
- [ ] アプリアイコン 1024px 原本（現在は 512px のアップスケール）

### P3: 配布

- [x] DMG 作成（`scripts/package-macos.sh`）
- [x] バージョン / ビルド番号（`0.7.0` / `1`）
- [x] arm64 限定（Intel 非対応）
- [ ] Developer ID 署名 + hardened runtime + `notarytool` 公証（証明書が必要）
- [ ] Gatekeeper / Keychain プロンプトの初回起動確認
- [ ] App Sandbox / Mac App Store を狙うか（localhost サーバと Keychain に影響）

### P4: CI / クリーンアップ

- [x] GitHub Actions（Rust / clippy / fmt / Swift 契約テスト / xcodebuild / UI テスト）
- [x] XCUITest（ログイン画面スモーク）
- [x] gpui 版の削除
- [x] Windows スキャフォールドの削除（展望は `docs/future.md`）
- [x] `docs/commands.md`（Tauri 時代）を `docs/legacy/` へアーカイブ

---

## 6. 決定事項

- 最小 macOS: 13.0
- アーキテクチャ: arm64 のみ（Intel 非対応）
- UI: SwiftUI のみ（gpui は削除）
- Windows: 将来の選択肢。コードは置かず `docs/future.md` に記録
- 音量設定: `UserDefaults` へ移行済み

---

## 付録: 主要コマンド

```bash
# Rust core + FFI
cargo test --workspace
cargo clippy --workspace --all-targets
cargo fmt --all --check

# Swift 契約テスト
scripts/test-ffi-swift.sh

# macOS アプリ
scripts/build-macos-app.sh --open
scripts/package-macos.sh          # .app + DMG

# UI テスト
xcodebuild test -project apps/macos/Streaid.xcodeproj \
  -scheme Streaid -destination 'platform=macOS' \
  CODE_SIGN_IDENTITY="-" CODE_SIGNING_REQUIRED=NO
```
