import { atom } from "recoil";

const state = atom<boolean>({
    key: "IsConnected",
    default: false,
});

export default state;
