import { atom } from "recoil";
import { RaiderType } from "../../types/Raider";

const state = atom<RaiderType[]>({
    key: "Raiders",
    default: [],
});

export default state;
