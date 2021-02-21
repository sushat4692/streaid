import Store from "electron-store";

export interface StoreType {
    "api.inited": boolean;
    username: string;
    password: string;
    channel: string;
    shoutout_message: string;
    shoutout_not_found: string;
    shoutout_failed: string;
}
const schema: Store.Schema<StoreType> = {
    "api.inited": {
        type: "boolean",
        default: false,
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
        default: "channelname",
    },
    shoutout_message: {
        type: "string",
        default:
            'Please check this Recommended Streamer "%username%". %url% The last streaming was "%category%".',
    },
    shoutout_not_found: {
        type: "string",
        default: `Target user "%username%" was't found, please check again.`,
    },
    shoutout_failed: {
        type: "string",
        default: `Failed to get Channel information of "%username%" channel, please try again later.`,
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
