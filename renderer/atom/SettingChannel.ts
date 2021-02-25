import { atom } from "recoil";

const state = atom<string>({
    key: "SettingChannel",
    default: "",
});

export default state;
