import { app, ipcMain, dialog } from "electron";
import { readFile, writeFile } from "fs-extra";
import isDev from "electron-is-dev";
import path from "path";

// Library
import { getInstance as getTwichAPIInstance } from "../lib/TwitchAPI";

// Store
import { getInstance as getStoreInstance } from "../store";

// Util
import { getWindow } from "../util/window";
import { playSound } from "../util/Sound";

// Menu
import { setMenu } from "../menu";

ipcMain.handle("setting:locale", async () => {
    const store = getStoreInstance();
    return store.get("locale", "en-us");
});

ipcMain.handle("setting:locale:update", async (_, values) => {
    const store = getStoreInstance();
    setMenu(values);
    return store.set("locale", values);
});

ipcMain.handle("settings:get", async () => {
    const store = getStoreInstance();
    const TwitchAPI = getTwichAPIInstance();
    TwitchAPI.init("__twitch_api_key__");
    const token = await TwitchAPI.getAccessToken();
    const user = await TwitchAPI.getUserInfo();

    store.set("username", user?.name);
    store.set("password", token?.accessToken);
    const shoutout_message = store.get("shoutout_message");
    const shoutout_not_found = store.get("shoutout_not_found");
    const shoutout_failed = store.get("shoutout_failed");
    const chatter_volume = store.get("chatter_volume");
    const raid_volume = store.get("raid_volume");
    const host_volume = store.get("host_volume");

    store.set("api.inited", true);
    return {
        username: store.get("username"),
        channel: store.get("channel"),
        shoutout_message,
        shoutout_not_found,
        shoutout_failed,
        chatter_volume,
        raid_volume,
        host_volume,
    };
});

ipcMain.handle("settings:store", (_, values) => {
    const store = getStoreInstance();
    store.set("channel", values.channel);

    return {
        username: store.get("username"),
        channel: store.get("channel"),
    };
});

ipcMain.handle("setting:shoutout_message", (_, values) => {
    const store = getStoreInstance();
    store.set("shoutout_message", values.shoutout_message);
    store.set("shoutout_not_found", values.shoutout_not_found);
    store.set("shoutout_failed", values.shoutout_failed);
    return values;
});

ipcMain.handle("setting:notification:sound", async (_, values) => {
    const win = getWindow();
    if (!win) {
        return false;
    }

    const file = await dialog.showOpenDialog(win, {
        properties: ["openFile"],
        filters: [
            {
                name: "Document",
                extensions: ["mp3"],
            },
        ],
    });

    if (!file || file.canceled) {
        return false;
    }

    const buffer = await readFile(file.filePaths[0]);
    await writeFile(
        path.join(isDev ? "." : app.getPath("userData"), `data/${values}.mp3`),
        buffer
    );

    return true;
});

ipcMain.handle("setting:notification:volume", async (_, values) => {
    const store = getStoreInstance();
    store.set(values.mode, values.value);
    return;
});

ipcMain.handle("setting:notification:play", async (_, values) => {
    const win = getWindow();
    return await playSound(win, values);
});
