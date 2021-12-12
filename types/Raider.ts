import { DocumentExtends } from "./Document";

export type RequestRaiderType = {
    channel: string;
    username: string;
    displayname: string;
    viewers: number;
};

export type RaiderType = DocumentExtends<RequestRaiderType>;
