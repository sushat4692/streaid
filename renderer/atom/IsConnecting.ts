import { atom } from "recoil";

const state = atom<boolean>({
    key: "IsConnecting",
    default: false,
});

export default state;
