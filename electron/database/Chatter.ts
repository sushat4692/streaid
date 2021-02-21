import dbFactory from "./factory";
import { Userstate } from "tmi.js";

const database = dbFactory("chatters.db", true);

export const pushChatter = async (userstate: Userstate) => {
    const chatter = await database.findOne({ username: userstate.username });

    if (chatter) {
        return false;
    }

    await database.insert(userstate);
    return true;
};

export const getChatters = async () => {
    return await database.find<Userstate>({}).sort({ createdAt: 1 });
};

export const removeChatter = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export default database;
