import { Reducer, createStore } from "redux";

export type ActionType = {
    type: "UPDATE";
    state: string;
};

const reducer: Reducer<string, ActionType> = (state: string = "", action) => {
    switch (action.type) {
        case "UPDATE":
            return action.state;
        default:
            return state;
    }
};

const store = createStore(reducer);

export const getState = () => store.getState();

export const subscribe = (listener: () => void) => {
    store.subscribe(listener);
};

export const updateAction = (state: string) => {
    store.dispatch({ type: "UPDATE", state });
};

export default store;
