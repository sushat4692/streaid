import { atom } from "recoil";

export interface TagInterface {
    id: string;
    isAuto: boolean;
    name: string;
    description: string;
}

const state = atom<TagInterface[]>({
    key: "ChannelTags",
    default: [],
});

export default state;
