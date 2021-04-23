import Store from "electron-store";

export interface StoreType {
    "api.inited": boolean;
    locale: string;
    username: string;
    password: string;
    channel: string;
    shoutout_message: string;
    shoutout_not_found: string;
    shoutout_failed: string;
    chatter_volume: number;
    raid_volume: number;
    host_volume: number;
}
const schema: Store.Schema<StoreType> = {
    "api.inited": {
        type: "boolean",
        default: false,
    },
    locale: {
        type: "string",
        default: "en-us",
    },
    username: {
        type: "string",
        default: "username",
    },
    password: {
        type: "string",
        default: "**********",
    },
    channel: {
        type: "string",
        default: "",
    },
    shoutout_message: {
        type: "string",
        default:
            'Please check this Recommended Streamer "%username%". %url% The last streaming was "%category%".',
    },
    shoutout_not_found: {
        type: "string",
        default: `Target user "%user_id%" was't found, please check again.`,
    },
    shoutout_failed: {
        type: "string",
        default: `Failed to get Channel information of "%username%" channel, please try again later.`,
    },
    chatter_volume: {
        type: "number",
        default: 1,
    },
    raid_volume: {
        type: "number",
        default: 1,
    },
    host_volume: {
        type: "number",
        default: 1,
    },
};

export default Store;

let instance: Store<StoreType>;
export const getInstance = () => {
    if (!instance) {
        instance = new Store<StoreType>({ schema });
    }

    return instance;
};
