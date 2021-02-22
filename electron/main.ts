import { app, BrowserWindow } from "electron";
import path from "path";

async function createWindow() {
    app.commandLine.appendSwitch(
        "--autoplay-policy",
        "no-user-gesture-required"
    );

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    win.loadFile(path.join(__dirname, "index.html"));
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

import "./ipcMain/Init";
import "./ipcMain/Settings";
import "./ipcMain/Channel";
import "./ipcMain/ChannelTemplate";
import "./ipcMain/Chatter";
import "./ipcMain/Bot";
