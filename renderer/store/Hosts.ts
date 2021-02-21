import { Reducer, createStore } from "redux";
import { Document } from "../../types/Document";

export interface HostRowType extends Document {
    channel: string;
    username: string;
    viewers: number;
    autohost: boolean;
}

export interface ActionType {
    type: "UPDATE";
    state: HostRowType[];
}

const reducer: Reducer<HostRowType[], ActionType> = (
    state: HostRowType[] = [],
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
