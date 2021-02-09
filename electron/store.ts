import Store from "electron-store";

export interface StoreType {
    username: string;
    password: string;
    channels: string[];
}
const schema: Store.Schema<StoreType> = {
    username: {
        type: "string",
        default: "username",
    },
    password: {
        type: "string",
        default: "**********",
    },
    channels: {
        type: "array",
        default: ["channelname"],
    },
};
const store = new Store<StoreType>({ schema });
export default store;
