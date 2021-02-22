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

const store = createStore(reducer);

export const getState = () => store.getState();

export const subscribe = (listener: () => void) => {
    store.subscribe(listener);
};

export const updateAction = (state: TagInterface[]) => {
    store.dispatch({ type: "UPDATE", state });
};

export default store;
