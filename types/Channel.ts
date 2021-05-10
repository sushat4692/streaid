import { TagType } from "./Tag";

export type ChannelType = {
    id: string;
    name: string;
    displayName: string;
    language: string;
    gameId: string;
    gameName: string;
    title: string;
    tags: TagType[];
};
