import { atom } from "recoil";
import { UserMemoType } from "../../types/UserMemo";

const state = atom<UserMemoType[]>({
    key: "UserMemo",
    default: [],
});

export default state;
