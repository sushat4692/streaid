import { atom } from "recoil";
import { TagType } from "../../types/Tag";

const state = atom<TagType[]>({
    key: "ChannelTags",
    default: [],
});

export default state;
