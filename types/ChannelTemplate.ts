import { DocumentExtends } from "./Document";

export type RequestChannelTemplateType = {
    title: string;
    gameId: string;
    gameName: string;
    boxArtUrl: string;
    language: string;
};

export type ChannelTemplateType = DocumentExtends<RequestChannelTemplateType>;
