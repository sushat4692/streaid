import { Reducer, createStore } from "redux";
import { Document } from "../../types/Document";

export interface RaiderRowType extends Document {
    channel: string;
    username: string;
    viewers: number;
}

export interface ActionType {
    type: "UPDATE";
    state: RaiderRowType[];
}

const reducer: Reducer<RaiderRowType[], ActionType> = (
    state: RaiderRowType[] = [],
    action
) => {
    switch (action.type) {
        case "UPDATE":
            return [...action.state];
        default:
            return state;
    }
};

export default createStore(reducer);
