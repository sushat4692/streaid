import { ipcRenderer } from "electron";

type SettingType = {
    username: string;
    password: string;
    channels: string[];
};

declare global {
    interface Window {
        getInit: () => Promise<boolean>;
        getSettings: () => Promise<SettingType>;
        saveSettings: (values: { channels: string[] }) => Promise<any>;
        signOut: () => Promise<any>;
        connectToTwicth: () => Promise<any>;
        disConnectToTwicth: () => Promise<any>;
        botConnected: () => void;
        botDisconnected: () => void;
    }
}

window.getInit = () => {
    return ipcRenderer.invoke("get:init") as Promise<boolean>;
};

window.getSettings = () => {
    return ipcRenderer.invoke("get:settings") as Promise<SettingType>;
};

window.saveSettings = (values) => {
    return ipcRenderer.invoke("save:settings", values);
};

window.signOut = () => {
    return ipcRenderer.invoke("signout");
};

window.connectToTwicth = () => {
    return ipcRenderer.invoke("bot:connect");
};

window.disConnectToTwicth = () => {
    return ipcRenderer.invoke("bot:disconnect");
};

ipcRenderer.on("bot:connected", () => {
    window.botConnected();
});

ipcRenderer.on("bot:disconnected", () => {
    window.botDisconnected();
});
