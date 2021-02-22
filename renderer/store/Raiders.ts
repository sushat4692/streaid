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

const store = createStore(reducer);

export const getState = () => store.getState();

export const subscribe = (listener: () => void) => {
    store.subscribe(listener);
};

export const updateAction = (state: RaiderRowType[]) => {
    store.dispatch({ type: "UPDATE", state });
};

export default store;
