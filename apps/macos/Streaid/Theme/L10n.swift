import Foundation

/// Tiny in-app localization table.
///
/// English strings are the keys; Japanese is looked up when the app locale is
/// `ja`. This keeps runtime language switching simple (no bundle reload).
enum L10n {
    static var locale: String = "en"

    static var isJapanese: Bool { locale == "ja" }

    static func t(_ key: String) -> String {
        guard locale == "ja" else { return key }
        return ja[key] ?? key
    }

    static func f(_ key: String, _ args: CVarArg...) -> String {
        String(format: t(key), arguments: args)
    }

    private static let ja: [String: String] = [
        // Navigation / common
        "Dashboard": "ダッシュボード",
        "Chatters": "チャッター",
        "Raiders": "レイダー",
        "Commands": "コマンド",
        "User Memo": "ユーザーメモ",
        "Model Test": "モデルテスト",
        "Config": "設定",
        "Vocabulary": "語彙",
        "Log": "ログ",
        "Credits": "クレジット",
        "Settings…": "設定…",
        "Language": "言語",
        "Choose the app language.": "アプリの言語を選択してください。",
        "System": "システム",
        "English": "英語",
        "Japanese": "日本語",
        "Start Listening": "リスニング開始",
        "Stop Listening": "リスニング停止",
        "Logout": "ログアウト",
        "Unknown User": "不明なユーザー",
        "Running": "実行中",
        "Stopped": "停止中",
        "Reconnecting…": "再接続中…",
        "Dismiss": "閉じる",
        "Cancel": "キャンセル",
        "Save": "保存",
        "Edit": "編集",
        "Copy": "コピー",
        "Open": "開く",
        "Clear": "クリア",
        "Volume": "音量",
        "Preview": "プレビュー",
        "Choose": "選択",
        "No file set": "ファイル未設定",
        "Everyone": "全員",
        "Moderator": "モデレーター",
        "Broadcaster": "配信者",
        "Allowed": "許可",
        "Response": "応答",
        "Memo (optional)": "メモ（任意）",
        "What is this command for?": "このコマンドの用途は？",
        "Username": "ユーザー名",
        "Nickname (optional)": "ニックネーム（任意）",
        "Memo": "メモ",
        "Remove from this session": "このセッションから削除",
        "Delete this raid": "このレイドを削除",
        "viewers": "視聴者",
        "%d viewers": "%d 視聴者",
        "Chatters (%d)": "チャッター (%d)",
        "Raiders (%d)": "レイダー (%d)",
        "Custom Commands (%d)": "カスタムコマンド (%d)",
        "Memos (%d)": "メモ (%d)",

        // Login
        "Connect your Twitch account": "Twitchアカウントを接続",
        "Streaid reads chat with a bot account so it can answer !ts and !d. Use the Client ID of your Twitch application.":
            "Streaidはボットアカウントでチャットを読み取り、!tsと!dに応答します。TwitchアプリケーションのクライアントIDを使用してください。",
        "Client ID": "クライアントID",
        "Twitch application Client ID": "TwitchアプリケーションのクライアントID",
        "Save Client ID": "クライアントIDを保存",
        "Waiting for authorization…": "認証を待っています…",
        "Log in with Twitch": "Twitchでログイン",
        "Create a Twitch application": "Twitchアプリケーションを作成",
        "Scopes used: chat:read, chat:edit. Tokens are stored in the macOS Keychain.":
            "使用スコープ: chat:read, chat:edit。トークンはmacOSキーチェーンに保存されます。",
        "This app is aiding your streaming.": "配信を支援するアプリです。",
        "Enter this code on Twitch": "Twitchでこのコードを入力",
        "Open Twitch": "Twitchを開く",
        "This code expires in about %d minutes.": "このコードの有効期限は約%d分です。",
        "Enter your Twitch Client ID first.": "先にTwitchのクライアントIDを入力してください。",
        "Authentication timed out. Please try again.":
            "認証がタイムアウトしました。もう一度お試しください。",
        "Client ID saved.": "クライアントIDを保存しました。",

        // Dashboard
        "Real-time Japanese ↔ English translation and dictionary lookup for Twitch chat.":
            "Twitchチャットの日本語↔英語翻訳と辞書検索をリアルタイムで行います。",
        "Chat Listener": "チャットリスナー",
        "Channel": "チャンネル",
        "Enable !ts / !d": "!ts / !d を有効化",
        "Session": "セッション",
        "Translations": "翻訳",
        "Lookups": "辞書検索",
        "%d lookups": "%d 回",
        "Provider": "プロバイダー",
        "Latest Translation": "最新の翻訳",
        "No translations yet": "まだ翻訳がありません",
        "Japanese or English messages with !ts will appear here.":
            "!tsを付けた日本語/英語のメッセージがここに表示されます。",
        "Latest Dictionary Lookup": "最新の辞書検索",
        "No lookups yet": "まだ辞書検索がありません",
        "Words looked up with !d will appear here.":
            "!dで調べた単語がここに表示されます。",
        "Start the listener to answer !ts (translation) and !d (dictionary) in chat.":
            "チャットで!ts（翻訳）と!d（辞書）に応答するにはリスナーを開始してください。",
        "Your channel": "自分のチャンネル",
        "Retrying connection…": "接続を再試行中…",
        "Local model (Bonsai %@)": "ローカルモデル (Bonsai %@)",
        "Examples": "例文",
        "Similar:": "類似:",
        "casual": "カジュアル",
        "formal": "フォーマル",
        "neutral": "ニュートラル",

        // Config
        "Credentials, chat behaviour, sounds and the OBS overlay.":
            "認証情報、チャット設定、効果音、OBSオーバーレイ。",
        "Translation Settings": "翻訳設定",
        "Gemini is used for !ts and !d unless the local model is enabled.":
            "ローカルモデルが有効でない限り、!tsと!dにはGeminiを使用します。",
        "Gemini API Key": "Gemini APIキー",
        "Enter your Gemini API key": "Gemini APIキーを入力",
        "•••••••• (saved in Keychain)": "••••••••（キーチェーンに保存済み）",
        "Save API Key": "APIキーを保存",
        "Configured": "設定済み",
        "Not configured": "未設定",
        "Stored in the macOS Keychain.": "macOSキーチェーンに保存されます。",
        "Get a key from Google AI Studio": "Google AI Studioでキーを取得",
        "Blank channel = monitor the authenticated account's own channel.":
            "空欄の場合は認証アカウント自身のチャンネルを監視します。",
        "Target Channel": "対象チャンネル",
        "your_channel": "あなたのチャンネル",
        "Shoutout": "シャウトアウト",
        "Show Info": "情報を表示",
        "Show Clip": "クリップを表示",
        "Used by !so and the ShoutOut buttons. Placeholders: %username%, %user_id%, %url%, %category%.":
            "!soとShoutOutボタンで使用。プレースホルダー: %username%, %user_id%, %url%, %category%。",
        "Shoutout Message": "シャウトアウトメッセージ",
        "Not Found Message": "未検出メッセージ",
        "Failed Message": "取得失敗メッセージ",
        "Info Display Time": "情報表示時間",
        "Save Shoutout Settings": "シャウトアウト設定を保存",
        "Reset to Defaults": "既定値に戻す",
        "Shoutout settings saved.": "シャウトアウト設定を保存しました。",
        "Local Model (Bonsai)": "ローカルモデル (Bonsai)",
        "Answer !ts and !d on-device with MLX. No API key required.":
            "MLXで!tsと!dをオンデバイス処理します。APIキーは不要です。",
        "Enable Local Model": "ローカルモデルを有効化",
        "Chat model": "チャットモデル",
        "Runtime ready": "ランタイム準備完了",
        "Runtime missing": "ランタイム未検出",
        "%@ running": "%@ 実行中",
        "%@ ready": "%@ 準備完了",
        "%@ missing": "%@ 未検出",
        "Run scripts/setup-bonsai.sh to download the MLX runtime and models.":
            "MLXランタイムとモデルをダウンロードするには scripts/setup-bonsai.sh を実行してください。",
        "Starting local model… (up to 90s)": "ローカルモデルを起動中…（最大90秒）",
        "Sound Notifications": "効果音通知",
        "First-message tracking resets on app restart.":
            "初回メッセージの追跡はアプリ再起動でリセットされます。",
        "Desktop notifications": "デスクトップ通知",
        "New Chatter Sound": "新規チャッター音",
        "Plays the first time a user speaks in this session.":
            "セッション内でユーザーが初めて発言したときに再生されます。",
        "Returning Chatter Sound": "再訪チャッター音",
        "Plays for every later message from that user.":
            "そのユーザーの2回目以降のメッセージで再生されます。",
        "Raid Sound": "レイド音",
        "Plays when someone raids your channel.":
            "誰かがチャンネルをレイドしたときに再生されます。",
        "OBS Overlay": "OBSオーバーレイ",
        "Add two Browser Sources in OBS: one for translations, one for alerts.":
            "OBSにブラウザソースを2つ追加します（翻訳用とアラート用）。",
        "Translation / Dictionary": "翻訳 / 辞書",
        "Shoutout Alert": "シャウトアウトアラート",
        "Enable a transparent background in OBS. Alert cards scale with the source size.":
            "OBSで背景を透明にしてください。アラートカードはソースサイズに合わせて拡大されます。",
        "Overlay URL copied.": "オーバーレイURLをコピーしました。",
        "Alert URL copied.": "アラートURLをコピーしました。",
        "Sound saved.": "効果音を保存しました。",
        "Discord Webhook": "Discord Webhook",
        "Post !d lookups to a Discord channel.": "!dの検索結果をDiscordチャンネルに投稿します。",
        "Webhook URL": "Webhook URL",
        "Save Webhook": "Webhookを保存",
        "Discord webhook saved.": "Discord Webhookを保存しました。",
        "Discord webhook failed.": "Discord Webhookへの投稿に失敗しました。",

        // Model Test
        "Try a translation or dictionary lookup without posting to Twitch.":
            "Twitchに投稿せずに翻訳・辞書検索を試せます。",
        "Input": "入力",
        "Mode": "モード",
        "Translation": "翻訳",
        "Dictionary": "辞書",
        "Run Test": "テスト実行",
        "Running…": "実行中…",
        "Enable the local model in Config before using a Bonsai provider.":
            "Bonsaiプロバイダーを使う前に設定でローカルモデルを有効にしてください。",
        "Japanese input returns English suggestions (and vice versa).":
            "日本語を入力すると英語の候補が返ります（逆も同様）。",
        "Only the first word is looked up.": "最初の単語のみ辞書検索します。",
        "Result": "結果",
        "Asking the model…": "モデルに問い合わせ中…",
        "No result yet": "まだ結果がありません",
        "Enter text above and run a test.": "上にテキストを入力してテストを実行してください。",

        // Log
        "Events received during this app session.": "このセッションで受信したイベント。",
        "Messages with !ts will appear here.": "!tsを付けたメッセージがここに表示されます。",

        // Vocabulary
        "Words looked up with !d, normalized by the AI into base forms.":
            "!dで調べた単語をAIが基本形に正規化したものです。",
        "Clear the entire vocabulary?": "語彙をすべて削除しますか？",
        "Clear Vocabulary": "語彙を削除",
        "This removes all recorded words and inflection history.":
            "記録された単語と活用履歴がすべて削除されます。",
        "Summary": "サマリ",
        "Base words": "基本語",
        "Analyze with AI": "AIで分析",
        "Classifying words…": "単語を分類中…",
        "AI Categories": "AIカテゴリ",
        "Top Words": "上位の単語",
        "No words yet": "まだ単語がありません",
        "Run !d in chat, or use Model Test with the dictionary mode.":
            "チャットで!dを実行するか、モデルテストの辞書モードを使ってください。",
        "Ambiguous Words": "曖昧な単語",
        "Words the model interpreted as multiple base forms.":
            "モデルが複数の基本形として解釈した単語。",

        // Lists
        "Users who spoke in this session. First-message tracking resets on restart.":
            "このセッションで発言したユーザー。初回メッセージの追跡は再起動でリセットされます。",
        "No chatters yet": "まだチャッターがいません",
        "Users will appear here when they speak in chat.":
            "ユーザーがチャットで発言するとここに表示されます。",
        "Raid history for this channel (newest first).":
            "このチャンネルのレイド履歴（新しい順）。",
        "No raids yet": "まだレイドがありません",
        "Raids will appear here with their viewer counts.":
            "レイドが視聴者数とともにここに表示されます。",
        "Built-ins: !ts, !d, !dice. Custom commands cannot override them.":
            "ビルトイン: !ts, !d, !dice。カスタムコマンドはこれらを上書きできません。",
        "New Command": "新規コマンド",
        "Edit Command": "コマンドを編集",
        "No custom commands": "カスタムコマンドがありません",
        "Add a command such as !hello and choose who can use it.":
            "!hello などのコマンドを追加し、使用できる権限を選びます。",
        "Command": "コマンド",
        "Notes about chatters and streamers.": "チャッターや配信者についてのメモ。",
        "New Memo": "新規メモ",
        "Edit Memo": "メモを編集",
        "No memos yet": "まだメモがありません",
        "Store a nickname or a note for a user.":
            "ユーザーのニックネームやメモを保存します。",

        // Credits
        "Streaid is built on the work of these projects and models.":
            "Streaidはこれらのプロジェクトとモデルに支えられています。",
        "Models & APIs": "モデル / API",
        "macOS App": "macOSアプリ",
        "Rust Core": "Rustコア",
        "Streaid is released under the MIT License.":
            "StreaidはMITライセンスで公開されています。",
        "Local on-device LLM (8B / 4B)": "ローカルLLM (8B / 4B)",
        "Local inference runtime": "ローカル推論ランタイム",
        "Cloud translation API": "クラウド翻訳API",
        "Native macOS UI": "ネイティブmacOS UI",
        "C ABI between Swift and Rust": "SwiftとRustのC ABI",
        "Open URLs in browser": "ブラウザでURLを開く",
        "App data directories": "アプリデータディレクトリ",
        "Async runtime / Twitch IRC": "非同期ランタイム / Twitch IRC",
        "HTTP client (Gemini API)": "HTTPクライアント (Gemini API)",
        "OBS overlay server": "OBSオーバーレイサーバー",
        "Serialization": "シリアライズ",
        "OS keychain storage": "OSキーチェーン保存",
        "Twitch OAuth device flow": "Twitch OAuthデバイスフロー",
        "Audio playback": "音声再生",
        "Timestamps": "タイムスタンプ",
        "Open %@": "%@を開く",

        // Notifications / errors
        "Chatter has come": "チャッターが来ました",
        "Thank you for coming \"%@\"": "「%@」さん、来てくれてありがとう！",
        "%d Raider has come": "%d人のレイダーが来ました",
        "Thank you for raiding \"%@\"": "「%@」さん、レイドありがとう！",
        "Chat listener is not running.": "チャットリスナーが起動していません。"
    ]
}
