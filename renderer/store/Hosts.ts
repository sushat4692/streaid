import { Reducer, createStore } from "redux";

export type HostRowType = {
    channel: string;
    host: { username: string; viewers: number; autohost: boolean };
};

export type ActionType = {
    type: "PUT" | "DELETE";
    state: HostRowType;
};

const reducer: Reducer<HostRowType[], ActionType> = (
    state: HostRowType[] = [],
    action
) => {
    switch (action.type) {
        case "PUT":
            state.push(action.state);
            return state;
        default:
            return state;
    }
};

export default createStore(reducer);
