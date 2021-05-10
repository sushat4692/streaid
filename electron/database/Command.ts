import dbFactory from "./factory";

// Types
import { RequestCommandType } from "../../types/Command";

const database = dbFactory("commands.db");

export const pushCommand = async (command: RequestCommandType) => {
    await database.insert(command);
};

export const getCommands = async () => {
    return await database.find<RequestCommandType>({}).sort({ createdAt: -1 });
};

export const findCommand = async (id: string) => {
    return await database.findOne<RequestCommandType>({ _id: id });
};

export const updateCommmand = async (
    id: string,
    command: RequestCommandType
) => {
    await database.update({ _id: id }, command);
};

export const removeCommand = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export default database;
