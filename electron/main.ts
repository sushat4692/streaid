import { app, BrowserWindow, shell } from "electron";
import path from "path";
import axios from "axios";
import https from "https";
import compareVersions from "compare-versions";

// Store
import { getInstance as getStoreInstance } from "./store";

// Menu
import { setMenu } from "./menu";

// Env
import { useEnv } from "./util/Env";
const env = useEnv();
env.set("mode", "__build__");
env.set("version", "__version__");

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
    env.set("main_window", win);

    win.loadFile(path.join(__dirname, "index.html"));
    // win.webContents.openDevTools();

    const result = await axios
        .get("https://twitch-support-tool-docs.vercel.app/version.json", {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        })
        .catch((e) => {
            console.log(e);
        });

    if (!result) {
        return;
    }

    if (compareVersions(env.get("version") as string, result.data.latest) < 0) {
        const versionWin = new BrowserWindow({
            width: 480,
            height: 640,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "preload.js"),
            },
        });

        versionWin.loadFile(path.join(__dirname, "version.html"));
        // versionWin.webContents.openDevTools();
        versionWin.webContents.once("did-finish-load", () => {
            versionWin.webContents.send("versions", result.data);
        });
        versionWin.webContents.setWindowOpenHandler((e) => {
            shell.openExternal(e.url);
            return { action: "deny" };
        });
    }
}

app.whenReady().then(() => {
    const store = getStoreInstance();
    const locale = store.get("locale");

    setMenu(locale);

    createWindow();
});

app.on("window-all-closed", async () => {
    app.quit();
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
