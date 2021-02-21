import { ipcMain } from "electron";

// Library
import { getInstance as getBotInstance } from "../lib/Bot";
import { getInstance as getTwichAPIInstance } from "../lib/TwitchAPI";

// Store
import { getInstance as getStoreInstance } from "../store";

ipcMain.handle("get:init", () => {
    const store = getStoreInstance();
    return store.get("api.inited", false);
});

ipcMain.handle("signout", async () => {
    const store = getStoreInstance();
    const Bot = getBotInstance();
    const TwitchAPI = getTwichAPIInstance();

    await Bot.disconnect();
    await TwitchAPI.disconnect();
    store.set("api.inited", false);

    return;
});
