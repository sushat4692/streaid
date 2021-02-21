import { ipcMain } from "electron";

// Database
import {
    pushChannelTemplate,
    getChannelTemplate,
    removeChannelTemplate,
} from "../database/ChannelTemplate";

ipcMain.handle("channel:template", async () => {
    return await getChannelTemplate();
});

ipcMain.handle("channel:template:push", async (_, values) => {
    await pushChannelTemplate(values);
    return await getChannelTemplate();
});

ipcMain.handle("channel:template:delete", async (_, values) => {
    await removeChannelTemplate(values.id);
    return await getChannelTemplate();
});
