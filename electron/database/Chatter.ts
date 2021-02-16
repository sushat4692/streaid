import dbFactory from "./factory";
import { Userstate } from "tmi.js";

const database = dbFactory("chatters.db");

export const pushChatter = async (userstate: Userstate) => {
    await database.insert(userstate);
};

export default database;
