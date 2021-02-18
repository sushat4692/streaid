import dbFactory from "./factory";

const database = dbFactory("hosts.db");

export type HostInformation = {
    username: string;
    viewers: number;
    autohost: boolean;
};

export const pushHost = async (host: HostInformation) => {
    await database.insert(host);
};

export default database;
