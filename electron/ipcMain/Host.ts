import { ipcMain } from "electron";

// Model
import { getHosts, removeHost } from "../database/Host";

ipcMain.handle("host", async () => {
    return await getHosts();
});

ipcMain.handle("host:delete", async (_, id: string) => {
    await removeHost(id);
    return await getHosts();
});
