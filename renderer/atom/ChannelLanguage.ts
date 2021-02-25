import { atom } from "recoil";

const state = atom<string>({
    key: "ChannelLanguage",
    default: "",
});

export default state;
