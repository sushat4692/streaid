import { Reducer, createStore } from "redux";

export interface TagInterface {
    id: string;
    isAuto: boolean;
    name: string;
    description: string;
}

export type ActionType = {
    type: "UPDATE";
    state: TagInterface[];
};

const reducer: Reducer<TagInterface[], ActionType> = (
    state: TagInterface[] = [],
    action
) => {
    switch (action.type) {
        case "UPDATE":
            return action.state;
        default:
            return state;
    }
};

export default createStore(reducer);
