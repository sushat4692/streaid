import { atom } from "recoil";
import { ChatterType } from "../../types/Chatter";

const state = atom<ChatterType[]>({
    key: "Chatters",
    default: [],
});

export default state;
