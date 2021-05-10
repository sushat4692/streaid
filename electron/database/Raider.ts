import dbFactory from "./factory";

const database = dbFactory("raiders.db");

export type RaiderInformation = {
    channel: string;
    username: string;
    viewers: number;
};

export const pushRaider = async (raider: RaiderInformation) => {
    await database.insert(raider);
};

export const getRaiders = async () => {
    return await database.find<RaiderInformation>({}).sort({ createdAt: 1 });
};

export const removeRaider = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export default database;
