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

export default createStore(reducer);
