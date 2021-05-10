import dbFactory from "./factory";

// Types
import { RequestChannelTemplateType } from "../../types/ChannelTemplate";

const database = dbFactory("channel_template.db");

export const pushChannelTemplate = async (
    template: RequestChannelTemplateType
) => {
    await database.insert(template);
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
