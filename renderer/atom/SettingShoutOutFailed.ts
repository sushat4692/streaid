import { atom } from "recoil";

const state = atom<string>({
    key: "SettingShoutOutFailed",
    default: "",
});

export default state;
