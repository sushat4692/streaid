import { atom } from "recoil";
import { ChannelTemplateType } from "../../types/ChannelTemplate";

const state = atom<ChannelTemplateType[]>({
    key: "ChannelTemplateRow",
    default: [],
});

export default state;
