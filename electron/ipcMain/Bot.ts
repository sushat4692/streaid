import { ipcMain } from "electron";

// Library
import { getInstance as getBotInstance } from "../lib/Bot";

// Command
import ShoutOut from "../lib/commands/ShoutOut";

ipcMain.handle("bot:connect", () => {
    const Bot = getBotInstance();
    Bot.connect();

    return;
});

ipcMain.handle("bot:disconnect", () => {
    const Bot = getBotInstance();
    Bot.disconnect();

    return;
});

ipcMain.handle("bot:shoutout", async (_e, username: string) => {
    await ShoutOut(username);
    return;
});
