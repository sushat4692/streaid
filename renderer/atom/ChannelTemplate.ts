import { atom } from "recoil";
import { Document } from "../../types/Document";

export interface ChannelTemplateRowType extends Document {
    title: string;
    gameId: string;
    gameName: string;
    boxArtUrl: string;
    language: string;
}

const state = atom<ChannelTemplateRowType[]>({
    key: "ChannelTemplateRowType",
    default: [],
});

export default state;
