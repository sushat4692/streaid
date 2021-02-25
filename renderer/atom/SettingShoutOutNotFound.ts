import { atom } from "recoil";

const state = atom<string>({
    key: "SettingShoutOutNotFound",
    default: "",
});

export default state;
