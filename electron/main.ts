import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";

// Library
import { getInstance as getBotInstance } from "./lib/Bot";
import { getInstance as getTwichAPIInstance } from "./lib/TwitchAPI";

// Command
import ShoutOut from "./lib/commands/ShoutOut";

// Store
import store from "./store";

async function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    win.loadFile("index.html");
    // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", async () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on("ready", async () => {
    // const channel = await api.client.kraken.channels.getMyChannel()
});

ipcMain.handle("get:init", () => {
    return store.get("api.inited", false);
});

ipcMain.handle("get:settings", async () => {
    const TwitchAPI = getTwichAPIInstance();
    TwitchAPI.init("__twitch_api_key__");
    const token = await TwitchAPI.getAccessToken();
    const user = await TwitchAPI.getUserInfo();

    store.set("username", user?.name);
    store.set("password", token?.accessToken);

    store.set("api.inited", true);
    return {
        username: store.get("username"),
        channels: store.get("channels"),
    };
});

ipcMain.handle("save:settings", (_, values) => {
    store.set("channels", values.channels);

    return {
        username: store.get("username"),
        channels: store.get("channels"),
    };
});

ipcMain.handle("signout", async () => {
    const Bot = getBotInstance();
    const TwitchAPI = getTwichAPIInstance();

    await Bot.disconnect();
    await TwitchAPI.disconnect();
    store.set("api.inited", false);

    return;
});

ipcMain.handle("bot:connect", () => {
    const Bot = getBotInstance();
    Bot.connect();

    return;
});

ipcMain.handle("bot:disconnect", () => {
    const Bot = getBotInstance();
    Bot.disconnect();

    return;
});

ipcMain.handle(
    "bot:shoutout",
    async (_e, values: { postChannel: string; username: string }) => {
        await ShoutOut(values.postChannel, values.username);
        return;
    }
);
