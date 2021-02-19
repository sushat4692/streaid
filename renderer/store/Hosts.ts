import { Reducer, createStore } from "redux";

export type HostRowType = {
    id: string;
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
        case "DELETE":
            return state.filter((row) => row.id !== action.state.id);
        default:
            return state;
    }
};

export default createStore(reducer);
