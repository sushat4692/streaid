import { atom } from "recoil";

const state = atom<boolean>({
    key: "IsInited",
    default: false,
});

export default state;
