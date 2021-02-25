import { atom } from "recoil";

const state = atom<string>({
    key: "SettingShoutOutMessage",
    default: "",
});

export default state;
