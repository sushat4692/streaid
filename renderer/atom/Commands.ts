import { atom } from "recoil";
import { CommandType } from "../../types/Command";

const state = atom<CommandType[]>({
    key: "Commmands",
    default: [],
});

export default state;
