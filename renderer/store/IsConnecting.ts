import { Reducer, createStore } from "redux";

export type ActionType = {
    type: "ENABLE" | "DISABLE" | "UPDATE";
    state?: boolean;
};

const reducer: Reducer<boolean, ActionType> = (
    state: boolean = false,
    action
) => {
    switch (action.type) {
        case "ENABLE":
            return true;
        case "DISABLE":
            return false;
        case "UPDATE":
            return action.state || false;
        default:
            return state;
    }
};

const store = createStore(reducer);

export const getState = () => store.getState();

export const subscribe = (listener: () => void) => {
    store.subscribe(listener);
};

export const enableAction = () => {
    store.dispatch({ type: "ENABLE" });
};

export const disableAction = () => {
    store.dispatch({ type: "DISABLE" });
};

export const updateAction = (state: boolean) => {
    store.dispatch({ type: "UPDATE", state });
};

export default store;
