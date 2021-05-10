import { atom } from "recoil";
import { HostType } from "../../types/Host";

const state = atom<HostType[]>({
    key: "Hosts",
    default: [],
});

export default state;
