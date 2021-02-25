import { atom } from "recoil";

const state = atom<number>({
    key: "SoundRaidVolume",
    default: 1,
});

export default state;
