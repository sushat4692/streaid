import { atom } from "recoil";

const state = atom<string>({
    key: "ChannelTitle",
    default: "",
});

export default state;
