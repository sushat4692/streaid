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
    "Common.Label.SelectFile": "Select File",
    "Common.Select.Placeholder": "Select...",
    "Common.Submit": "Submit",
    "Common.Apply": "Apply",
    "Common.Close": "Close",
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
    "Component.SettingSoundChats.Descript":
        "Play selected sound per all the chats",
    "Component.SettingSoundChatters.Descript":
        "Play selected sound per the first chat per persons",
    "Component.SettingSoundHosts.Descript": "Play selected sound per raids",
    "Component.SettingSoundRaiders.Descript": "Play selected sound per hosts",
    // User
    "Component.User.Memo": "Memo",
};

export default messages;
