import { ipcMain } from "electron";

// Store
import { getInstance as getStoreInstance } from "../store";

ipcMain.handle("translate:deepl", async () => {
    const store = getStoreInstance();
    return {
        apikey: store.get("deepl_key"),
        plan: store.get("deepl_plan"),
    };
});

ipcMain.handle("translate:deepl:apikey", async (_, key: string) => {
    const store = getStoreInstance();
    return store.set("deepl_key", key);
});

ipcMain.handle("translate:deepl:plan", async (_, key: "free" | "pro") => {
    const store = getStoreInstance();
    return store.set("deepl_plan", key);
});

ipcMain.handle("translate:e2j:discord", async () => {
    const store = getStoreInstance();
    return {
        webhook: store.get("discord_webhook"),
    };
});

ipcMain.handle("translate:e2j:discord:webhook", async (_, url: string) => {
    const store = getStoreInstance();
    return store.set("discord_webhook", url);
});

ipcMain.handle("translate:j2e:discord", async () => {
    const store = getStoreInstance();
    return {
        webhook: store.get("discord_webhook_j2e"),
    };
});

ipcMain.handle("translate:j2e:discord:webhook", async (_, url: string) => {
    const store = getStoreInstance();
    return store.set("discord_webhook_j2e", url);
});
