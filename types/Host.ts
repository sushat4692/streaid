import { DocumentExtends } from "./Document";

export type RequestHostType = {
    channel: string;
    username: string;
    viewers: number;
    autohost: boolean;
};

export type HostType = DocumentExtends<RequestHostType>;
