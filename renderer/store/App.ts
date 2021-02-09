import { Reducer, createStore } from "redux";

export const Action = {
    UPDATE: "UPDATE",
    START_CONNECTING: "START_CONNECTING",
    STOP_CONNECTING: "STOP_CONNECTING",
};

export type StoreInterface = {
    isInited?: boolean;
    isConnected?: boolean;
    isConnecting?: boolean;
    username?: string;
    password?: string;
    channels?: string;
};

export type StoreAction = {
    type: string;
    state?: StoreInterface;
};

export const defaultValue: StoreInterface = {
    isInited: false,
    isConnected: false,
    isConnecting: false,
    username: "",
    password: "",
    channels: "",
};

const reducer: Reducer<StoreInterface, StoreAction> = (
    state: StoreInterface = defaultValue,
    action
) => {
    switch (action.type) {
        case Action.UPDATE:
            return { ...state, ...action.state };
        case Action.START_CONNECTING:
            return { ...state, ...{ isConnecting: true } };
        case Action.STOP_CONNECTING:
            return { ...state, ...{ isConnecting: false } };
        default:
            return state;
    }
};

export default createStore(reducer);
