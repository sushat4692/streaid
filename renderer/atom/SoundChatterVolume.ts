import { atom } from "recoil";

const state = atom<number>({
    key: "SoundChatterVolume",
    default: 1,
});

export default state;
