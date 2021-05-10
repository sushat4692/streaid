import { ipcMain } from "electron";

// Model
import { getChatters, removeChatter } from "../database/Chatter";

ipcMain.handle("chatter", async () => {
    return await getChatters();
});

ipcMain.handle("chatter:delete", async (_, id) => {
    await removeChatter(id);
    return await getChatters();
});
