import { Reducer, createStore } from "redux";

export interface GameInterface {
    id: string;
    name: string;
    boxArtUrl: string;
}

export type ActionType = {
    type: "UPDATE";
    state: GameInterface;
};

const reducer: Reducer<GameInterface, ActionType> = (
    state: GameInterface = null,
    action
) => {
    switch (action.type) {
        case "UPDATE":
            return { ...action.state };
        default:
            return state;
    }
};

const store = createStore(reducer);

export const getState = () => store.getState();

export const subscribe = (listener: () => void) => {
    store.subscribe(listener);
};

export const updateAction = (state: GameInterface) => {
    store.dispatch({ type: "UPDATE", state });
};

export default store;
