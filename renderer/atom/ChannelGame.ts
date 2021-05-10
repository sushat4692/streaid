import { atom } from "recoil";
import { GameType } from "../../types/Game";

const state = atom<GameType>({
    key: "ChannelGame",
    default: {
        id: "",
        name: "",
        boxArtUrl: "",
    },
});

export default state;
