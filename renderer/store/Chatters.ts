import { Reducer, createStore } from "redux";
import { ChatUserstate } from "tmi.js";

export type ChatterRowType = {
    id: string;
    channel: string;
    userstate: ChatUserstate;
};

export type ActionType = {
    type: "PUT" | "DELETE";
    state: ChatterRowType;
};

const reducer: Reducer<ChatterRowType[], ActionType> = (
    state: ChatterRowType[] = [],
    action
) => {
    switch (action.type) {
        case "PUT":
            if (
                !state.some(
                    (row) =>
                        row.channel === action.state.channel &&
                        row.userstate.username ===
                            action.state.userstate.username
                )
            ) {
                state.push(action.state);
            }
            return state;
        case "DELETE":
            return state.filter((row) => row.id !== action.state.id);
        default:
            return state;
    }
};

export default createStore(reducer);
