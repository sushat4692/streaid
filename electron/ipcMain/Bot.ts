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

ipcMain.handle(
    "bot:shoutout",
    async (
        _e,
        values: { postRoomId?: string; postChannel?: string; username: string }
    ) => {
        await ShoutOut(values);
        return;
    }
);
