import { ipcMain } from "electron";

// Library
import { getInstance as getTwichAPIInstance } from "../lib/TwitchAPI";

// Store
import { getInstance as getStoreInstance } from "../store";

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

    store.set("api.inited", true);
    return {
        username: store.get("username"),
        channel: store.get("channel"),
        shoutout_message,
        shoutout_not_found,
        shoutout_failed,
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
