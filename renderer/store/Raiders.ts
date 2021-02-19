import { Reducer, createStore } from "redux";

export type RaiderRowType = {
    id: string;
    channel: string;
    raider: { username: string; viewers: number };
};

export type ActionType = {
    type: "PUT" | "DELETE";
    state: RaiderRowType;
};

const reducer: Reducer<RaiderRowType[], ActionType> = (
    state: RaiderRowType[] = [],
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
