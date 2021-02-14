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

export default createStore(reducer);
