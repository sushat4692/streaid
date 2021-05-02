import { atom } from "recoil";

const state = atom<number>({
    key: "ShoutoutAlertInfoLength",
    default: 8,
});

export default state;
