import { Reducer, createStore } from "redux";

export type ActionType = {
    type: "UPDATE";
    state: number;
};

const reducer: Reducer<number, ActionType> = (state: number = 1, action) => {
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

export const updateAction = (state: number) => {
    store.dispatch({ type: "UPDATE", state });
};

export default store;
