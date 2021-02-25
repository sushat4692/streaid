import { atom } from "recoil";

const state = atom<number>({
    key: "SoundHostVolume",
    default: 1,
});

export default state;
