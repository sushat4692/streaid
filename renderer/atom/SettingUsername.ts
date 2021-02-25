import { atom } from "recoil";

const state = atom<string>({
    key: "SettingUsername",
    default: "",
});

export default state;
