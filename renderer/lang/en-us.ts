const messages: { [key: string]: string } = {
    /**
     * Common
     */
    "Common.Title": "Twitch Support Tool",
    "Common.Chatters.Name": "Chatters",
    "Common.Chatters.Description":
        "Display user list that comment to target channel.",
    "Common.Raiders.Name": "Raiders",
    "Common.Raiders.Description":
        "Display user list that raided to target channel.",
    "Common.Hosts.Name": "Hosts",
    "Common.Hosts.Description":
        "Display user list that hosted to target channel.",
    "Common.Channel.Name": "Channel",
    "Common.Channel.Description": "You can check/update Channel information.",
    "Common.Settings.Name": "Settings",
    "Common.License.Name": "License",
    "Common.Label.Username": "Username",
    "Common.Label.Channel": "チャンネル",
    "Common.Label.Displayname": "Displayname",
    "Common.Label.Autoloaded": "Autoloaded",
    "Common.Label.Viewers": "Viewers",
    "Common.Label.Title": "Title",
    "Common.Label.Category": "Category",
    "Common.Label.Language": "Language",
    "Common.Label.Tags": "Tags",
    "Common.Label.Created": "Created",
    "Common.Label.ShoutOut": "ShoutOut",
    "Common.Label.Volume": "Volume",
    "Common.Label.SelectFile": "Select File",
    "Common.Select.Placeholder": "Select...",
    "Common.Submit": "Submit",
    "Common.Apply": "Apply",
    "Common.SignIn": "Signin",
    "Common.SignOut": "Signout",
    "Common.Variable.Variable": "Variable",
    "Common.Variable.Description": "Description",
    "Common.Variable.Url.Description": "Target Channel URL",
    "Common.Variable.Username.Description": "Target User Display Name",
    "Common.Variable.UserId.Description": "Target User ID",
    "Common.Variable.Category.Description": "Target Category/Game name",

    /**
     * Views
     */
    // Init
    "View.Init.Header": "Signin to Twitch",
    // Dashboard
    "View.Dashboard.CheckButton": "Check",

    /**
     * Pages
     */
    // NeedSetting
    "Page.NeedSetting.Lead": "Please update application setting first.",
    // Channel
    "Page.Channel.Information.Header": "Channel Information",
    "Page.Channel.Information.TagNotice": "Tags are not editable for now",
    "Page.Channel.Information.SaveTemplate": "Save to Template",
    "Page.Channel.Template.Header": "Channel Template",

    /**
     * Components
     */
    // Connect
    "Component.Connect.Enable": "Connect",
    "Component.Connect.Disable": "Disconnect",
    // SettingLocale
    "Component.SettingLocale.Header": "Language",
    // SettingBot
    "Component.SettingBot.Header": "Bot Target Channel",
    "Component.SettingBot.ChannelHelp":
        "* If you set same channel with username, you can update channel information",
    // SettingShoutOutMessage
    "Component.SettingShoutOutMessage.Header": "ShoutOut Message",
    "Component.SettingShoutOutMessage.Message": "ShoutOut Message Template",
    "Component.SettingShoutOutMessage.Failed": "Failed Message Template",
    "Component.SettingShoutOutMessage.NotFound": "Not Found Message Template",
    // SettingSound
    "Component.SettingSound.Header": "Notification Sound",
};

export default messages;
