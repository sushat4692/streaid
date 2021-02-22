import { Reducer, createStore } from "redux";
import { Document } from "../../types/Document";

interface Badges {
    admin?: string;
    bits?: string;
    broadcaster?: string;
    partner?: string;
    global_mod?: string;
    moderator?: string;
    vip?: string;
    subscriber?: string;
    staff?: string;
    turbo?: string;
    premium?: string;
    founder?: string;
    ["bits-leader"]?: string;
    ["sub-gifter"]?: string;
    [other: string]: string | undefined;
}

interface BadgeInfo {
    subscriber?: string;
    [other: string]: string | undefined;
}

export interface ChatterRowType extends Document {
    "message-type"?: "chat" | "action" | "whisper";
    username?: string;
    bits?: string;
    badges?: Badges;
    "badge-info"?: BadgeInfo;
    color?: string;
    "display-name"?: string;
    emotes?: { [emoteid: string]: string[] };
    id?: string;
    mod?: boolean;
    turbo?: boolean;
    "emotes-raw"?: string;
    "badges-raw"?: string;
    "badge-info-raw"?: string;
    "room-id"?: string;
    subscriber?: boolean;
    "user-type"?: "" | "mod" | "global_mod" | "admin" | "staff";
    "user-id"?: string;
    "tmi-sent-ts"?: string;
    flags?: string;
    [paramater: string]: any;
}

export type ActionType = {
    type: "UPDATE";
    state: ChatterRowType[];
};

const reducer: Reducer<ChatterRowType[], ActionType> = (
    state: ChatterRowType[] = [],
    action
) => {
    switch (action.type) {
        case "UPDATE":
            return [...action.state];
        default:
            return state;
    }
};

const store = createStore(reducer);

export const getState = () => store.getState();

export const subscribe = (listener: () => void) => {
    store.subscribe(listener);
};

export const updateAction = (state: ChatterRowType[]) => {
    store.dispatch({ type: "UPDATE", state });
};

export default store;
