import dbFactory from "./factory";

const database = dbFactory("raiders.db");

export type RaiderInformation = {
    username: string;
    viewers: number;
};

export const pushRaider = async (raider: RaiderInformation) => {
    await database.insert(raider);
};

export default database;
