import Store from "electron-store";

type StoreType = {
    "api.inited": boolean;
    locale: string;
    username: string;
    password: string;
    channel: string;
    shoutout_message: string;
    shoutout_not_found: string;
    shoutout_failed: string;
    shoutout_info_length: number;
    alert_http_port: number;
    alert_socket_port: number;
    chatter_volume: number;
    chat_volume: number;
    raid_volume: number;
    host_volume: number;
    deepl_key: string;
    deepl_plan: string;
};

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
    shoutout_info_length: {
        type: "number",
        default: 8,
    },
    alert_http_port: {
        type: "number",
        default: 9990,
    },
    alert_socket_port: {
        type: "number",
        default: 9999,
    },
    chatter_volume: {
        type: "number",
        default: 1,
    },
    chat_volume: {
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
    deepl_key: {
        type: "string",
        default: "",
    },
    deepl_plan: {
        type: "string",
        default: "free",
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
