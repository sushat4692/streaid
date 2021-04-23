import { atom } from "recoil";

const state = atom<number>({
    key: "SoundChatVolume",
    default: 1,
});

export default state;
