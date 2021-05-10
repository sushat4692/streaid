import { ChatterType } from "./Chatter";
import { HostType } from "./Host";
import { RaiderType } from "./Raider";

export type ModeType =
    | "bot:connected"
    | "bot:disconnected"
    | "bot:chatted"
    | "bot:raided"
    | "bot:hosted"
    | "sound:play";

export type ValuesType = {
    "bot:connected": Record<string, never>;
    "bot:disconnected": Record<string, never>;
    "bot:chatted": ChatterType[];
    "bot:raided": RaiderType[];
    "bot:hosted": HostType[];
    "sound:play": { source: Uint8Array; gain: number };
};
