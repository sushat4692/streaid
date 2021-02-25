import { atom } from "recoil";
import { Document } from "../../types/Document";

export interface HostRowType extends Document {
    channel: string;
    username: string;
    viewers: number;
    autohost: boolean;
}

const state = atom<HostRowType[]>({
    key: "Hosts",
    default: [],
});

export default state;
