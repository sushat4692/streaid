const messages: { [key: string]: string } = {
    /**
     * Common
     */
    "Common.Title": "Twitch Support Tool",
    "Common.Chats.Name": "Chats",
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
    "Common.UserMemo.Name": "User memo",
    "Common.UserMemo.Description":
        "You can store the target additional information.",
    "Common.Command.Name": "Command",
    "Common.Command.Description": "You can manage your own channel command.",
    "Common.Settings.Name": "Settings",
    "Common.License.Name": "License",
    "Common.Label.Username": "User name",
    "Common.Label.NickName": "Nick name",
    "Common.Label.Channel": "Channel",
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
    "Common.Label.Command": "Command",
    "Common.Label.Priviledge": "Priviledge",
    "Common.Label.Body": "Body",
    "Common.Label.Memo": "Memo",
    "Common.Label.StopCommand": "Stop Command",
    "Common.Label.DisplayLength": "Display Time Length",
    "Common.Label.SelectFile": "Select File",
    "Common.Label.ApiKey": "API Key",
    "Common.Label.Plan": "Plan",
    "Common.Select.Placeholder": "Select...",
    "Common.Submit": "Submit",
    "Common.Apply": "Apply",
    "Common.Close": "Close",
    "Common.Copy": "Copy",
    "Common.SignIn": "Signin",
    "Common.SignOut": "Signout",
    "Common.Variable.Variable": "Variable",
    "Common.Variable.Description": "Description",
    "Common.Variable.Url.Description": "Target Channel URL",
    "Common.Variable.Username.Description": "Target User Display Name",
    "Common.Variable.UserId.Description": "Target User ID",
    "Common.Variable.Category.Description": "Target Category/Game name",
    "Common.Unit.Second": "s",

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
    // License
    "Page.License.MIT1":
        'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
    "Page.License.MIT2":
        "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.",
    "Page.License.MIT3":
        'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
    "Page.License.ThankYou": "Thank you for developers of dependency libraries",

    /**
     * Components
     */
    // Connect
    "Component.Connect.Enable": "Connect",
    "Component.Connect.Disable": "Disconnect",
    // Setting
    "Component.Setting.General": "General",
    // SettingLocale
    "Component.SettingLocale.Header": "Language",
    // SettingBot
    "Component.SettingBot.Header": "Target Channel",
    "Component.SettingBot.ChannelHelp":
        "* If you set same channel with username, you can update channel information",
    // SettingShoutOutMessage
    "Component.SettingShoutOutMessage.Header": "ShoutOut Message",
    "Component.SettingShoutOutMessage.Message": "ShoutOut Message Template",
    "Component.SettingShoutOutMessage.Failed": "Failed Message Template",
    "Component.SettingShoutOutMessage.NotFound": "Not Found Message Template",
    // SettingShoutOutAlert
    "Component.SettingShoutOutAlert.Header": "ShoutOut Alert",
    "Component.SettingShoutOutAlert.URL.Header": "ShoutOut Alert",
    "Component.SettingShoutOutAlert.URL.Descript":
        'Please copy & Pase the following URL and embed "Browser" to your streaming tool (e.g. OBS)',
    "Component.SettingShoutOutAlert.Server.Start": "Start Alert Server",
    "Component.SettingShoutOutAlert.Server.Stop": "Stop Alert Server",
    "Component.SettingShoutOutAlert.Port.Http.Header": "Embed",
    "Component.SettingShoutOutAlert.Port.Http.Descript":
        "Embed information to Streaming Tool",
    "Component.SettingShoutOutAlert.Port.Http.Label":
        "HTTP Port (For embed URL for OBS)",
    "Component.SettingShoutOutAlert.Port.Socket.Label": "Socket Port",
    "Component.SettingShoutOutAlert.Length.Header": "Display Length Setting",
    "Component.SettingShoutOutAlert.Info.Header": "Info",
    "Component.SettingShoutOutAlert.Info.Descript":
        "Showing alert the streamer information",
    "Component.SettingShoutOutAlert.Clip.Header": "Clip",
    "Component.SettingShoutOutAlert.Clip.Descript":
        "Showing alert the streamer's clip movie",
    "Component.SettingShoutOutAlert.Clip.StopHelp":
        "You can use this command when you want to stop the clip movie",
    // SettingSound
    "Component.SettingSound.Header": "Notification Sound",
    "Component.SettingSoundChats.Descript":
        "Play selected sound per all the chats",
    "Component.SettingSoundChatters.Descript":
        "Play selected sound per the first chat per persons",
    "Component.SettingSoundHosts.Descript": "Play selected sound per raids",
    "Component.SettingSoundRaiders.Descript": "Play selected sound per hosts",
    // SettingTranslate
    "Component.SettingTranslate.Header": "Translate Command",
    "Component.SettingTranslate.DeepL.Header": "DeepL Translate",
    "Component.SettingTranslate.Descript":
        "You can use Translation command after copy&paste the DeepL API Key (required signup to DeepL)",
    "Component.SettingTranslate.Free": "Free",
    "Component.SettingTranslate.Pro": "Pro",
    "Component.SettingTranslate.Dictionary.Header": "JP to EN Dictionary",
    "Component.SettingTranslate.Dictionary.Descript":
        "You can get the meaning of word from English to Japanese through the following command",
    // User
    "Component.User.Memo": "Memo",
    // Command
    "Component.Command.everyone": "Everyone",
    "Component.Command.vip": "VIP",
    "Component.Command.mod": "Modelator",
    "Component.Command.broadcaster": "Broadcaster",
    "Component.Command.New": "New Command",
};

export default messages;
