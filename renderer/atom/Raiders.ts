import { atom } from "recoil";
import { Document } from "../../types/Document";

export interface RaiderRowType extends Document {
    channel: string;
    username: string;
    viewers: number;
}

const state = atom<RaiderRowType[]>({
    key: "Raiders",
    default: [],
});

export default state;
