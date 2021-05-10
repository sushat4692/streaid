import { DocumentExtends } from "./Document";
import { BadgeType, BadgeInfoType } from "./Badge";

export type RequestChatterType = {
    "message-type"?: "chat" | "action" | "whisper";
    username?: string;
    bits?: string;
    badges?: BadgeType;
    "badge-info"?: BadgeInfoType;
    color?: string;
    "display-name"?: string;
    emotes?: { [emoteid: string]: string[] };
    id?: string;
    mod?: boolean;
    turbo?: boolean;
    "emotes-raw"?: string;
    "badges-raw"?: string;
    "badge-info-raw"?: string;
    "room-id"?: string;
    subscriber?: boolean;
    "user-type"?: "" | "mod" | "global_mod" | "admin" | "staff";
    "user-id"?: string;
    "tmi-sent-ts"?: string;
    flags?: string;
    [paramater: string]: unknown;
};

export type ChatterType = DocumentExtends<RequestChatterType>;
