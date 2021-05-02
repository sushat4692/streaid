import { ipcMain } from "electron";

// Library
import { getInstance as getBotInstance } from "../lib/Bot";

// Command
import { useCommand } from "../lib/commands";

// Store
import { getInstance as getStoreInstance } from "../store";

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
        {
            username,
            showWindow = null,
        }: { username: string; showWindow: string | null }
    ) => {
        const Bot = getBotInstance();
        const store = getStoreInstance();

        const channelName = store.get("channel");
        if (!Bot.client || !channelName) {
            return;
        }

        const command = useCommand();
        const message = await command.trigger("!so", username, showWindow);

        if (message) {
            Bot.client.action(channelName, message);
        }
        return;
    }
);
