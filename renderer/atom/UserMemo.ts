import { atom } from "recoil";
import { Document } from "../../types/Document";

export interface UserMemoRowType extends Document {
    username: string;
    nickname: string;
    memo: string;
}

const state = atom<UserMemoRowType[]>({
    key: "UserMemo",
    default: [],
});

export default state;
