# Electron版（master）機能の復旧計画（確定版）

作成日: 2026-11-23
比較対象:
- **Electron版**: `master`（v0.4.1、`electron/` + `renderer/` + `alert/`）
- **現行版**: `feature/native`（SwiftUI + Rust core 0.7.0）

このドキュメントは計画と実装状況を記録する。実装はSprint単位で進める。

承認: 2026-11-23（最小Helixクライアント実装 / Discordは `!d` のみ）

実装状況: **Sprint 1 / Sprint 2 完了（2026-11-23）**

Sprint 1:
- IRCタグ / USERNOTICE（Raid）パース
- `ChatMessageEvent` 拡張 + `RaidEvent`
- commands / memos / raiders / settings のJSONストア
- `chatter` / `chat` / `raid` の通知音スロット（`first` / `remaining` 読み替え）
- `UNUserNotificationCenter` による通知基盤

Sprint 2:
- Chatters / Raiders 一覧ページ（削除対応）
- カスタムコマンド + 権限 + `!dice` + 管理UI
- User Memo のCRUD + 管理UI
- FFI CRUD（raiders / commands / memos）
- `STREAID_DATA_DIR` によるテスト用データ分離

Sprint 3:
- 読み取り専用Helixクライアント（users / channels / clips）
- `!so` / `!so user info` / `!so user clip` / `!stop`（mod / broadcaster）
- Shoutout文面3種 + info表示秒数
- アラートオーバーレイ `/alert` + SSE（`:4242`）
- Chatters / Raiders / User Memo のShoutOutボタン
- `settings.get` / `settings.set` FFI

Sprint 4:
- 日本語UI（`L10n`、言語設定、アラートページの `?lang=ja`）
- `!dice` の日本語応答
- Discord Webhook（`!d` の結果をEmbed投稿）
- 日本語ログイン画面のXCUITest

Sprint 5:
- README / AGENTS / architecture / testing / FFI ドキュメントの最終更新
- 全テスト・Swift契約テスト・XCUITest・Release/DMGビルドの確認
- 手動受け入れ（実Twitch / OBS / Discord）は未実施

---

## 1. 決定事項（今回の最終スコープ）

| 項目 | 決定 |
|---|---|
| Tier 1 | **すべて実施** |
| Tier 2-1（Twitch API） | 単独の「チャンネル管理API」は**やらない**。ただし `!so` / アラートに必要な**読み取り専用の最小Helixクライアント**は実装する（確認済み） |
| Tier 2-2（`channel:manage:broadcast`） | **やらない**（チャンネル編集をしないため不要。再認証も不要） |
| Tier 2-3（`!so`） | **やる** |
| Tier 2-4（アラート） | **やる**。既存の翻訳オーバーレイ（`:4242`）に機能追加 |
| Tier 2-5（チャンネル情報/テンプレート） | **やらない**（前回使いづらかったため） |
| 日本語UI | **やる**（en / ja） |
| アップデート確認 | **やらない**（署名しないため） |
| About / Help | **やらない**（別サイト・別リポジトリで対応） |
| Discord Webhook | **やる**（`!d` のみ、確認済み） |
| 旧コマンドのエイリアス | **やらない** |
| Electronデータ移行 | **やらない** |
| Host | **対象外** |
| 旧SQLite辞書 | **やらない** |
| アラートURL | **`:4242` に統一**（旧 9990/9999 は使わない） |
| Windows | 対象外（`docs/future.md`） |

### 2-1 についての補足（重要）

`!so` とアラート表示には、以下の読み取りが必要です。

- ユーザー情報（表示名・プロフィール画像）
- チャンネル情報（カテゴリ名）
- 最新クリップ（クリップURL / embed URL）

そのため **読み取り専用の最小Helixクライアント**は `!so` / アラートの前提部品として実装します。
以下は行いません：

- チャンネルタイトル/カテゴリ/言語の更新
- `channel:manage:broadcast` スコープの追加
- チャンネルテンプレート
- タグ取得

既存の `chat:read` / `chat:edit` トークンのまま動く範囲で実装します（追加スコープ・再認証なし）。

---

## 2. 最終スコープの機能一覧

### 2.1 Tier 1（すべて）

1. **IRCタグ + USERNOTICE 解析**
   - `display-name`, `user-id`, `color`, `badges`, `mod`, `vip`, `subscriber`, `tmi-sent-ts`, `room-id` を保持
   - `USERNOTICE`（`msg-id=raid`）から Raid イベントを生成
   - Host は解析しない
2. **永続ストア（JSON）**
   - `commands.json`（カスタムコマンド）
   - `memos.json`（ユーザーメモ）
   - `raiders.json`（Raid履歴）
   - `settings.json`（Shoutout文面、アラート表示秒数、言語、Discord Webhook設定など）
   - 原子的書き込み（`vocabulary.rs` の方式を流用）
3. **Chatter / Raider 追跡**
   - Chatter: セッション内の初回発言検知 + 一覧 + 削除
   - Raider: 履歴を永続化 + 一覧 + 削除
   - Host: なし
4. **デスクトップ通知**
   - 初回チャッター、Raid
   - `UNUserNotificationCenter`。拒否時はアプリ内トーストにフォールバック
5. **通知音**
   - `chatter` / `chat` / `raid` の3スロット（`host` は将来用に予約のみ）
   - 既存の `first` / `remaining` は読み替え（現在の効果音を維持）
   - 音量はスロットごとに保存
6. **カスタムコマンド + 権限**
   - `broadcaster` / `mod` / `vip` / `everyone`
   - 追加・編集・削除UI
   - 予約名（`!ts`, `!d`, `!dice`, `!so`, `!stop`）は上書き不可
   - `!dice` を内蔵
7. **User Memo**
   - `username` / `nickname` / `memo` のCRUD + 一覧

### 2.2 Tier 2（削減版）

8. **読み取り専用 Helix クライアント（最小）**
   - `GET /helix/users?login=`
   - `GET /helix/channels?broadcaster_id=`
   - `GET /helix/clips?broadcaster_id=&first=1`
   - 既存トークン + client_id を使用。追加スコープなし
9. **Shoutout**
   - `!so {user}`（mod / broadcaster のみ）
   - `!so {user} info`（メッセージ + infoアラート）
   - `!so {user} clip`（メッセージ + clipアラート）
   - `!stop`（clipアラート停止）
   - 文面テンプレート: `%username%`, `%user_id%`, `%url%`, `%category%`
   - 未検出 / 取得失敗メッセージ
   - 一覧の各行に **ShoutOutボタン**（Show Info / Show Clip）を追加
10. **アラートオーバーレイ（翻訳オーバーレイに追加）**
    - `http://localhost:4242/alert` をOBS Browser Source用に追加
    - info: プロフィール画像・表示名・「Please check the Streamer!」・表示秒数（0〜60秒）
    - clip: 最新クリップを再生、`!stop` で停止
    - 既存の翻訳オーバーレイ `http://localhost:4242/` はそのまま
    - 旧ポート 9990/9999 は提供しない

### 2.3 Tier 3（削減版）

11. **日本語UI**
    - SwiftUI String Catalog（`Localizable.xcstrings`）で en / ja
    - 設定で「システム / English / 日本語」
    - メニュー、トースト、エラー、空状態、設定画面まで対象
    - アラートページの文言もアプリ言語に追従
    - `!dice` やShoutoutの既定文面も en / ja を用意（ユーザー編集可）
12. **Discord Webhook**
    - `!d` の結果をEmbedで投稿（単語・意味・例文・ユーザー・時刻）
    - 設定画面でWebhook URLを保存
    - 投稿失敗してもチャット応答は成功扱い
    - `!ts` の投稿は今回の対象外（必要なら後日）

### 2.4 やらないこと（明示）

- Host の追跡・通知・音
- チャンネル情報の取得/更新、テンプレート、タグ
- `channel:manage:broadcast` スコープ追加・再認証
- `!e2j` / `!j2e` / `!e2e`、ローカルSQLite辞書
- DeepL
- アップデート確認
- About / Help メニュー
- Electronデータ移行
- アラート用の旧ポート 9990/9999
- Windows対応

---

## 3. 実装計画

### Sprint 1: チャット基盤 + 永続ストア（目安 1.5〜2週間）

**Rust core**
- `chat.rs`
  - IRCタグのパース（`IrcTags` 構造体）
  - `USERNOTICE`（raid）のパース
  - `IrcMessage` に表示名・user-id・color・badges・mod/vip/broadcaster を追加
- `lib.rs`
  - `ChatMessageEvent` を拡張
  - `RaidEvent` と `AppEvent::Raid` を追加
  - `!ts` / `!d` の既存処理を壊さないよう、コマンド判定を分離
- `store.rs`（新規）
  - JSONの読み書き（atomic write）
  - `commands.json` / `memos.json` / `raiders.json` / `settings.json`
- `sounds.rs`
  - `chatter` / `chat` / `raid` スロット
  - `first` / `remaining` の読み替え
- テスト
  - タグ付きPRIVMSG、raid USERNOTICE、store roundtrip、権限判定

**Swift**
- `StreaidModels.swift` に `RaidEvent` / 拡張 `ChatMessageEvent`
- `AppState` に chatters / raiders / notifications の土台
- `UserNotifications` の許可要求と通知送信

### Sprint 2: Chatter / Raider / 通知音 / カスタムコマンド / メモ（目安 2〜3週間）

**Rust core**
- `commands.rs`（新規）
  - ビルトイン + カスタムコマンド
  - 権限判定（badges / mod / vip / broadcaster）
  - `!dice`
  - 予約名の保護
- `lib.rs`
  - `handle_commands` をレジストリ経由に変更
  - カスタムコマンドの応答送信（既存の500msレート制限内）
- `raiders.json` / `memos.json` / `commands.json` のCRUD関数
- FFI
  - `raiders.list` / `raiders.delete`
  - `commands.list` / `commands.save` / `commands.delete`
  - `memos.list` / `memos.save` / `memos.delete`

**Swift**
- 新規ページ: `ChattersView`, `RaidersView`, `CommandsView`, `UserMemoView`
- サイドバーに追加
- 通知音設定を3スロット（chatter/chat/raid）に拡張
- 通知許可が拒否された場合の案内
- Chatters / Raiders / Memos の行に削除ボタン（ShoutOutボタンはSprint 3）

**受け入れ条件**
- 初回チャッターで通知+音、Raidで通知+音
- カスタムコマンドが権限どおりに動く
- `!dice` が動く
- メモの追加・編集・削除が永続化される
- 既存の `!ts` / `!d` / 翻訳オーバーレイが回帰しない

### Sprint 3: Shoutout + アラート + 最小Helix（目安 2〜3週間）

**Rust core**
- `twitch.rs`（新規）
  - users / channels / clips の読み取り
  - 401/403/429 のエラーハンドリング
- `shoutout.rs`（新規）
  - `!so` のメッセージ生成（テンプレート置換）
  - `!so user info` / `!so user clip`
  - `!stop`
- `overlay.rs` / `alert.rs`
  - `/alert` HTML（埋め込み）
  - `/alert/events` SSE
  - info / clip / clip:stop イベント
  - 表示秒数設定
- FFI
  - `shoutout.run`（UIボタン用）
  - `shoutout.settings.get` / `set`
  - （`!so` はIRC経由でも動作）

**Swift**
- 設定画面にShoutout文面（3種）とinfo表示秒数
- Configに `http://localhost:4242/alert` のコピー/オープン
- Chatters / Raiders / Memos の行に ShoutOut ボタン（Show Info / Show Clip）
- アラートはOBS Browser Sourceで確認

**受け入れ条件**
- `!so user` でメッセージ
- `!so user info` でプロフィールアラート
- `!so user clip` でクリップ再生、`!stop` で停止
- UIのShoutOutボタンでも同じ動作
- 既存の翻訳オーバーレイが同時に動く

### Sprint 4: 日本語UI + Discord Webhook（目安 1.5〜2週間）

**日本語UI**
- `Localizable.xcstrings` に全UI文字列を移行
- `AppState` / `RootView` にロケール設定
- 設定画面に「システム / English / 日本語」
- メニュー・トースト・エラー・空状態・Shoutout既定文面・`!dice` を翻訳
- アラートページの文言を `?lang=ja` などで切替

**Discord Webhook**
- 設定画面にWebhook URL（保存はKeychainまたはアプリデータ）
- `!d` 成功時にEmbedをPOST
- 失敗時はログのみ（チャット応答は継続）
- テスト用に無効化トグルを用意（任意）

**受け入れ条件**
- en / ja の両方で主要画面が崩れない
- 設定変更が再起動後も保持される
- `!d` の結果がDiscordに届く（URL設定時）

### Sprint 5: QA / パッケージ（目安 1週間）

- `cargo test --workspace` / clippy / fmt
- Swift契約テスト / UIスモークテスト
- 実Twitchでの手動受け入れ（chatter/raid/commands/shoutout/alert/Discord）
- DMG再生成、README/AGENTS/docs更新
- 既存の `!ts` / `!d` / Bonsai / 翻訳オーバーレイの回帰確認

---

## 4. アーキテクチャ変更

### 4.1 Rust core

```
crates/streaid-core/src/
├── chat.rs          # IRCタグ、PRIVMSG、USERNOTICE(raid)
├── commands.rs      # ビルトイン + カスタム、権限、!dice
├── store.rs         # JSON永続ストア
├── twitch.rs        # 読み取り専用Helix（users/channels/clips）
├── shoutout.rs      # !so / !stop のメッセージとアラート
├── overlay.rs       # / と /alert のaxumサーバ、SSE
├── sounds.rs        # chatter/chat/raid（+host予約）
├── lib.rs           # AppEvent拡張、コマンドディスパッチ
└── auth.rs          # 既存スコープのまま（変更なし）
```

- 追加スコープなし。既存トークンでHelixの読み取りのみ行う。
- Host関連のコードは追加しない。
- チャンネル更新・テンプレートは追加しない。

### 4.2 FFI 追加（案）

| 領域 | メソッド |
|---|---|
| Raid | `raiders.list`, `raiders.delete` |
| Commands | `commands.list`, `commands.save`, `commands.delete` |
| Memos | `memos.list`, `memos.save`, `memos.delete` |
| Shoutout | `shoutout.run`, `shoutout.settings.get`, `shoutout.settings.set` |
| Discord | `discord.get_webhook`, `discord.set_webhook` |
| Events | `ChatMessageEvent` 拡張 + `RaidEvent` |

`!so` / `!stop` はIRC経由で実行されるため、FFIはUIボタン用の `shoutout.run` のみ。

### 4.3 データファイル

`~/Library/Application Support/im.sush.streaid/`

```
commands.json
memos.json
raiders.json
settings.json        # shoutout文面、info秒数、locale、Discord設定
sounds/
  chatter.{ext}
  chat.{ext}
  raid.{ext}
```

- Chatters はセッション内のみ（Electronと同じ）。
- Raiders は履歴として永続化。
- 既存の `first` / `remaining` 音声は読み替えて維持。

### 4.4 アラートオーバーレイ

| 用途 | URL |
|---|---|
| 翻訳・辞書オーバーレイ（既存） | `http://localhost:4242/` |
| Shoutoutアラート（新規） | `http://localhost:4242/alert` |

- SSEで `info` / `clip` / `clip:stop` を配信。
- info: プロフィール画像、表示名、カテゴリ、表示秒数。
- clip: `embed_url` を優先。MP4直リンクが安定しない場合はTwitch埋め込みプレイヤーを使う。
- `!stop` で `clip:stop`。

---

## 5. 工数

| Sprint | 内容 | フルタイム | 片手間 |
|---|---|---:|---:|
| 1 | チャット基盤 + ストア | 1.5〜2週間 | 3〜4週間 |
| 2 | Chatter/Raider/音/コマンド/メモ | 2〜3週間 | 4〜6週間 |
| 3 | Helix + Shoutout + アラート | 2〜3週間 | 4〜6週間 |
| 4 | 日本語UI + Discord | 1.5〜2週間 | 3〜4週間 |
| 5 | QA / パッケージ | 1週間 | 2週間 |
| **合計** |  | **約6〜8週間** | **約12〜16週間** |

Tier 1（Sprint 1〜2）だけなら **3〜4週間（フルタイム）**。

---

## 6. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| Twitchのclip再生（embed/MP4）がOBSで不安定 | アラートが出ない | embedプレイヤーを第一候補、MP4をフォールバック。OBSで実機確認 |
| Helixのレート制限/401 | `!so` が失敗 | エラーメッセージを返す。トークン再取得は既存のrefreshに任せる |
| 権限判定（badges/mod/vip） | コマンドが誤動作 | タグのユニットテスト + 実機確認 |
| 通知許可が拒否される | 通知が出ない | アプリ内トーストにフォールバック |
| 日本語UIの文字列量 | 作業量増 | String Catalogに一括移行し、Sprint 4でまとめて翻訳 |
| 既存機能の回帰 | `!ts` / `!d` / Bonsaiが壊れる | CIのRust/Swiftテスト + 手動受け入れ |
| RaidのUSERNOTICE仕様差異 | Raidが取れない | 実IRCログでタグを確認し、パーサを調整 |
| `!so` の文面/プレースホルダ | 表示崩れ | テンプレートのバリデーションとプレビュー |

---

## 7. 受け入れテスト（概要）

### チャット/イベント
- [ ] 初回チャッターで通知 + `chatter` 音
- [ ] 2回目以降で `chat` 音
- [ ] Raidで通知 + `raid` 音 + 一覧追加
- [ ] Chatters / Raiders の削除

### コマンド
- [ ] カスタムコマンド（everyone / vip / mod / broadcaster）
- [ ] `!dice`
- [ ] 予約名の上書き不可
- [ ] 既存 `!ts` / `!d` が動作

### Shoutout / アラート
- [ ] `!so user` でメッセージ
- [ ] `!so user info` でinfoアラート
- [ ] `!so user clip` でclipアラート
- [ ] `!stop` で停止
- [ ] UIのShoutOutボタン
- [ ] OBSで翻訳オーバーレイとアラートが同時に表示

### 日本語UI / Discord
- [ ] en / ja 切替、再起動後も保持
- [ ] 主要画面の文字切れなし
- [ ] `!d` の結果がDiscord Webhookに届く
- [ ] Webhook未設定/失敗時もチャットは正常

---

## 8. 参考: Electron版との対応（要約）

| Electron | 今回の扱い |
|---|---|
| Chatter / Raider / Host | Chatter / Raider は復旧、Host は対象外 |
| 通知音 4スロット | chatter / chat / raid の3スロット（host予約） |
| カスタムコマンド + 権限 | 復旧 |
| `!dice` | 復旧 |
| User Memo | 復旧 |
| `!so` / `!stop` / info・clipアラート | 復旧（`:4242/alert` に統合） |
| チャンネル情報 / テンプレート | 対象外 |
| 旧SQLite辞書 `!e2j` / `!j2e` / `!e2e` | 対象外 |
| DeepL `!ts` | 対象外（Gemini/Bonsaiを維持） |
| Discord Webhook | 復旧（`!d`） |
| 日本語UI | 復旧 |
| アップデート確認 / About / Help | 対象外（別サイト） |
| Electronデータ移行 | 対象外 |
| Windows | 対象外（`docs/future.md`） |
