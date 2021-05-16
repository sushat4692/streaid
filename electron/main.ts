import { app, BrowserWindow } from "electron";
import path from "path";

// Store
import { getInstance as getStoreInstance } from "./store";

// Menu
import { setMenu } from "./menu";

// Env
import { useEnv } from "./util/Env";
const env = useEnv();
env.set("mode", "__build__");

async function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    win.loadFile(path.join(__dirname, "index.html"));
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    const store = getStoreInstance();
    const locale = store.get("locale");

    setMenu(locale);

    createWindow();
});

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

import "./ipcMain/Init";
import "./ipcMain/Settings";
import "./ipcMain/Channel";
import "./ipcMain/ChannelTemplate";
import "./ipcMain/Chatter";
import "./ipcMain/Raider";
import "./ipcMain/Host";
import "./ipcMain/Bot";
import "./ipcMain/UserMemo";
import "./ipcMain/Server";
import "./ipcMain/Command";
import "./ipcMain/Translate";
