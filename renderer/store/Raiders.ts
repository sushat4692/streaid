import { Reducer, createStore } from "redux";

export type RaiderRowType = {
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
        default:
            return state;
    }
};

export default createStore(reducer);
