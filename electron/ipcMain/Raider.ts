import { ipcMain } from "electron";

// Model
import { getRaiders, removeRaider } from "../database/Raider";

ipcMain.handle("raider", async () => {
    return await getRaiders();
});

ipcMain.handle("raider:delete", async (_, values) => {
    await removeRaider(values.id);
    return await getRaiders();
});
