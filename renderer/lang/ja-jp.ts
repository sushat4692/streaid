const messages: { [key: string]: string } = {
    /**
     * Common
     */
    "Common.Title": "Twitchサポートツール",
    "Common.Chatters.Name": "チャット",
    "Common.Chatters.Description":
        "チャットをしてくれたユーザーの一覧を表示します。",
    "Common.Raiders.Name": "レイド",
    "Common.Raiders.Description":
        "レイドをしてくれたユーザーの一覧を表示します。",
    "Common.Hosts.Name": "ホスト",
    "Common.Hosts.Description":
        "ホストをしてくれたユーザーの一覧を表示します。",
    "Common.Channel.Name": "チャンネル",
    "Common.Channel.Description": "チャンネル情報の確認・更新します。",
    "Common.Settings.Name": "設定",
    "Common.License.Name": "ライセンス",
    "Common.Label.Username": "ユーザー名",
    "Common.Label.Channel": "チャンネル",
    "Common.Label.Displayname": "表示名",
    "Common.Label.Autoloaded": "自動ホスト",
    "Common.Label.Viewers": "閲覧数",
    "Common.Label.Title": "タイトル",
    "Common.Label.Category": "カテゴリー",
    "Common.Label.Language": "言語",
    "Common.Label.Tags": "タグ",
    "Common.Label.Created": "登録日",
    "Common.Label.ShoutOut": "シャウトアウト",
    "Common.Label.Volume": "音量",
    "Common.Label.SelectFile": "ファイル選択",
    "Common.Select.Placeholder": "選択してください",
    "Common.Submit": "送信",
    "Common.Apply": "反映",
    "Common.SignIn": "ログイン",
    "Common.SignOut": "ログアウト",
    "Common.Variable.Variable": "変数名",
    "Common.Variable.Description": "説明",
    "Common.Variable.Url.Description": "対象チャンネルURL",
    "Common.Variable.Username.Description": "対象ユーザー表示名",
    "Common.Variable.UserId.Description": "対象ユーザーID",
    "Common.Variable.Category.Description": "対象チャンネルカテゴリー名",

    /**
     * Views
     */
    // Init
    "View.Init.Header": "Twitchにログイン",
    // Dashboard
    "View.Dashboard.CheckButton": "確認",

    /**
     * Pages
     */
    // Chatters
    // Channel
    "Page.Channel.Information.Header": "チャンネル情報",
    "Page.Channel.Information.TagNotice": "タグは現在編集不可です",
    "Page.Channel.Information.SaveTemplate": "テンプレートに保存",
    "Page.Channel.Template.Header": "テンプレート一覧",
    // Page
    "Page.License.MIT1":
        "以下に定める条件に従い、本ソフトウェアおよび関連文書のファイル（以下「ソフトウェア」）の複製を取得するすべての人に対し、ソフトウェアを無制限に扱うことを無償で許可します。これには、ソフトウェアの複製を使用、複写、変更、結合、掲載、頒布、サブライセンス、および/または販売する権利、およびソフトウェアを提供する相手に同じことを許可する権利も無制限に含まれます。",
    "Page.License.MIT2":
        "上記の著作権表示および本許諾表示を、ソフトウェアのすべての複製または重要な部分に記載するものとします。",
    "Page.License.MIT3":
        "ソフトウェアは「現状のまま」で、明示であるか暗黙であるかを問わず、何らの保証もなく提供されます。ここでいう保証とは、商品性、特定の目的への適合性、および権利非侵害についての保証も含みますが、それに限定されるものではありません。 作者または著作権者は、契約行為、不法行為、またはそれ以外であろうと、ソフトウェアに起因または関連し、あるいはソフトウェアの使用またはその他の扱いによって生じる一切の請求、損害、その他の義務について何らの責任も負わないものとします。",
    "Page.License.ThankYou": "依存パッケージの開発者に感謝",

    /**
     * Components
     */
    // Connect
    "Component.Connect.Enable": "接続",
    "Component.Connect.Disable": "切断",
    // SettingLocale
    "Component.SettingLocale.Header": "言語設定",
    // SettingBot
    "Component.SettingBot.Header": "ボット対象チャンネル設定",
    "Component.SettingBot.ChannelHelp":
        "※ ログインユーザーと対象チャンネルを同じにするとチャンネル情報を更新できるようになります",
    // SettingShoutOutMessage
    "Component.SettingShoutOutMessage.Header": "シャウトアウトメッセージ設定",
    "Component.SettingShoutOutMessage.Message": "シャウトアウトテンプレート",
    "Component.SettingShoutOutMessage.Failed":
        "シャウトアウト失敗時テンプレート",
    "Component.SettingShoutOutMessage.NotFound":
        "シャウトアウト対象不明時テンプレート",
    // SettingSound
    "Component.SettingSound.Header": "通知音設定",
};

export default messages;
