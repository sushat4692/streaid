import { Reducer, createStore } from "redux";

export type ChannelTemplateRowType = {
    id: string;
    title: string;
    gameId: string;
    gameName: string;
    boxArtUrl: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
};

export type ActionType = {
    type: "PUT" | "UPDATE";
    state: ChannelTemplateRowType | ChannelTemplateRowType[];
};

const reducer: Reducer<ChannelTemplateRowType[], ActionType> = (
    state: ChannelTemplateRowType[] = [],
    action
) => {
    switch (action.type) {
        case "PUT":
            state.push(action.state as ChannelTemplateRowType);
            return state;
        case "UPDATE":
            return [...(action.state as ChannelTemplateRowType[])];
        default:
            return state;
    }
};

export default createStore(reducer);
