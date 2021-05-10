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
import { setCache } from "../util/Sound";

// Menu
import { setMenu } from "../menu";

ipcMain.handle("setting:locale", async () => {
    const store = getStoreInstance();
    return store.get("locale", "en-us");
});

ipcMain.handle("setting:locale:update", async (_, locale: string) => {
    const store = getStoreInstance();
    setMenu(locale);
    return store.set("locale", locale);
});

ipcMain.handle("setting:get", async () => {
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
    const shoutout_info_length = store.get("shoutout_info_length");
    const chatter_volume = store.get("chatter_volume");
    const chat_volume = store.get("chat_volume");
    const raid_volume = store.get("raid_volume");
    const host_volume = store.get("host_volume");

    store.set("api.inited", true);
    return {
        username: store.get("username"),
        channel: store.get("channel"),
        shoutout_message,
        shoutout_not_found,
        shoutout_failed,
        shoutout_info_length,
        chatter_volume,
        chat_volume,
        raid_volume,
        host_volume,
    };
});

ipcMain.handle("setting:store", (_, values) => {
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

ipcMain.handle(
    "setting:shoutout:alert:length",
    (_, { mode, value }: { mode: string; value: number }) => {
        const store = getStoreInstance();

        switch (mode) {
            case "info":
                store.set("shoutout_info_length", value);
                return value;
            default:
                return null;
        }
    }
);

ipcMain.handle(
    "setting:notification:sound",
    async (_, mode: "chatter" | "chat" | "raid" | "host") => {
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
            path.join(
                isDev ? "." : app.getPath("userData"),
                `data/${mode}.mp3`
            ),
            buffer
        );
        setCache(mode, buffer);

        return true;
    }
);

ipcMain.handle(
    "setting:notification:volume",
    async (
        _,
        values: {
            mode: "chatter_volume" | "raid_volume" | "host_volume";
            value: number;
        }
    ) => {
        const store = getStoreInstance();
        store.set(values.mode, values.value);
        return values.value;
    }
);

ipcMain.handle(
    "setting:notification:play",
    async (_, mode: "chatter" | "chat" | "raid" | "host") => {
        const win = getWindow();
        return await playSound(win, mode);
    }
);
