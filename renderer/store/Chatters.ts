import { Reducer, createStore } from "redux";
import { ChatUserstate } from "tmi.js";

export type ActionType = {
    type: "PUT" | "DELETE";
    state: ChatUserstate;
};

const reducer: Reducer<ChatUserstate[], ActionType> = (
    state: ChatUserstate[] = [],
    action
) => {
    switch (action.type) {
        case "PUT":
            if (
                !state.some(
                    (userstate) => userstate.username === action.state.username
                )
            ) {
                state.push(action.state);
            }
            return state;
        case "DELETE":
            return state.filter(
                (userstate) => userstate.username !== action.state.username
            );
        default:
            return state;
    }
};

export default createStore(reducer);
