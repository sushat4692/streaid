import dbFactory from "./factory";

const database = dbFactory("user_memo.db");

export type UserMemoInformation = {
    username: string;
    nickname: string;
    memo: string;
};

export const storeUserMemo = async (userMemo: UserMemoInformation) => {
    await database.update({ username: userMemo.username }, userMemo, {
        upsert: true,
    });
};

export const getUserMemos = async () => {
    return await database.find<UserMemoInformation>({}).sort({ createdAt: 1 });
};

export const getUserMemoByUsername = async (username: string) => {
    return await database.findOne<UserMemoInformation>({ username });
};

export const removeUserMemo = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export const removeUserMemoByUsername = async (username: string) => {
    await database.remove({ username }, {});
};

export default database;
