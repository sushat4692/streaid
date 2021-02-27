import { atom } from "recoil";

const state = atom<string>({
    key: "Locale",
    default: "en-us",
});

export default state;
