import dbFactory from "./factory";

const database = dbFactory("hosts.db");

export type HostInformation = {
    channel: string;
    username: string;
    viewers: number;
    autohost: boolean;
};

export const pushHost = async (host: HostInformation) => {
    await database.insert(host);
};

export const getHosts = async () => {
    return await database.find<HostInformation>({}).sort({ createdAt: 1 });
};

export const removeHost = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export default database;
