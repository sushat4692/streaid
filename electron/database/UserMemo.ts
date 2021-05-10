import dbFactory from "./factory";
import { RequestUserMemoType } from "../../types/UserMemo";

const database = dbFactory("user_memo.db");

export const storeUserMemo = async (userMemo: RequestUserMemoType) => {
    await database.update({ username: userMemo.username }, userMemo, {
        upsert: true,
    });
};

export const getUserMemos = async () => {
    return await database.find<RequestUserMemoType>({}).sort({ createdAt: 1 });
};

export const getUserMemoByUsername = async (username: string) => {
    return await database.findOne<RequestUserMemoType>({ username });
};

export const removeUserMemo = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export const removeUserMemoByUsername = async (username: string) => {
    await database.remove({ username }, {});
};

export default database;
