import { ipcMain } from "electron";

// Types
import { RequestCommandType } from "../../types/Command";

// Model
import {
    getCommands,
    pushCommand,
    findCommand,
    updateCommmand,
    removeCommand,
} from "../database/Command";

//
import { useCommand } from "../lib/commands";

ipcMain.handle("command", async () => {
    return await getCommands();
});

ipcMain.handle("command:push", async (_, command: RequestCommandType) => {
    await pushCommand(command);

    const commandModel = useCommand();
    commandModel.push(command.command, {
        allow: command.allow,
        handler: () => command.body,
    });

    return await getCommands();
});

ipcMain.handle(
    "command:update",
    async (_, { id, command }: { id: string; command: RequestCommandType }) => {
        await updateCommmand(id, command);

        const commandModel = useCommand();
        commandModel.push(command.command, {
            allow: command.allow,
            handler: () => command.body,
        });

        return await getCommands();
    }
);

ipcMain.handle("command:delete", async (_, id: string) => {
    const command = await findCommand(id);

    if (command) {
        const commandModel = useCommand();
        commandModel.remove(command.command);
    }
    await removeCommand(id);

    return await getCommands();
});
