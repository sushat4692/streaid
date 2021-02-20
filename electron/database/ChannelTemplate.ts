import dbFactory from "./factory";
import { Userstate } from "tmi.js";

const database = dbFactory("channel_template.db");

export interface ChannelTemplateType {
    title: string;
    gameId: string;
    gameName: string;
    boxArtUrl: string;
    language: string;
}

export const pushChannelTemplate = async (userstate: Userstate) => {
    await database.insert(userstate);
};

export const getChannelTemplate = async () => {
    return await database.find<ChannelTemplateType>({}).sort({ createdAt: -1 });
};

export const removeChannelTemplate = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export default database;
