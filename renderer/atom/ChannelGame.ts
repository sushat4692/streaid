import { atom } from "recoil";

export interface GameInterface {
    id: string;
    name: string;
    boxArtUrl: string;
}

const state = atom<GameInterface>({
    key: "ChannelGame",
    default: {
        id: "",
        name: "",
        boxArtUrl: "",
    },
});

export default state;
