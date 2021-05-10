import dbFactory from "./factory";
import { Userstate } from "tmi.js";

// Types
import { RequestChannelTemplateType } from "../../types/ChannelTemplate";

const database = dbFactory("channel_template.db");

export const pushChannelTemplate = async (userstate: Userstate) => {
    await database.insert(userstate);
};

export const getChannelTemplate = async () => {
    return await database
        .find<RequestChannelTemplateType>({})
        .sort({ createdAt: -1 });
};

export const removeChannelTemplate = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export default database;
