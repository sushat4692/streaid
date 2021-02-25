import { ipcMain } from "electron";

// Model
import { getHosts, removeHost } from "../database/Host";

ipcMain.handle("host", async () => {
    return await getHosts();
});

ipcMain.handle("host:delete", async (_, values) => {
    await removeHost(values.id);
    return await getHosts();
});
