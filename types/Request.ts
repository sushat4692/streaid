import { ChannelType } from "./Channel";
import { GameType } from "./Game";
import { TagType } from "./Tag";
import { ChannelTemplateType } from "./ChannelTemplate";
import { ChatterType } from "./Chatter";
import { HostType } from "./Host";
import { SettingType } from "./Setting";
import { UserMemoType, RequestUserMemoType } from "./UserMemo";
import { RaiderType } from "./Raider";

export type ModeType =
    | "bot:connect"
    | "bot:disconnect"
    | "bot:shoutout"
    | "channel:info"
    | "channel:game"
    | "channel:games"
    | "channel:tags"
    | "channel:update"
    | "channel:template"
    | "channel:template:push"
    | "channel:template:delete"
    | "chatter"
    | "chatter:delete"
    | "host"
    | "host:delete"
    | "get:init"
    | "signout"
    | "raider"
    | "raider:delete"
    | "server:init"
    | "server:create"
    | "server:close"
    | "server:port:update"
    | "setting:locale"
    | "setting:locale:update"
    | "setting:get"
    | "setting:store"
    | "setting:shoutout_message"
    | "setting:shoutout:alert:length"
    | "setting:notification:sound"
    | "setting:notification:volume"
    | "setting:notification:play"
    | "usermemo"
    | "usermemo:one"
    | "usermemo:store"
    | "usermemo:delete";

export type ValuesType = {
    "bot:connect": Record<string, never>;
    "bot:disconnect": Record<string, never>;
    "bot:shoutout": { username: string; showWindow: string | null };
    "channel:info": { username: string };
    "channel:game": { gameId: string };
    "channel:games": { gameName: string };
    "channel:tags": { username: string };
    "channel:update": {
        username: string;
        title: string;
        gameId: string;
        language: string;
    };
    "channel:template": Record<string, never>;
    "channel:template:push": {
        title: string;
        gameId: string;
        gameName: string;
        boxArtUrl: string;
        language: string;
    };
    "channel:template:delete": string;
    chatter: Record<string, never>;
    "chatter:delete": string;
    host: Record<string, never>;
    "host:delete": string;
    "get:init": Record<string, never>;
    signout: Record<string, never>;
    raider: Record<string, never>;
    "raider:delete": string;
    "server:init": Record<string, never>;
    "server:create": Record<string, never>;
    "server:close": Record<string, never>;
    "server:port:update": { mode: string; value: number };
    "setting:locale": Record<string, never>;
    "setting:locale:update": string;
    "setting:get": Record<string, never>;
    "setting:store": { channel: string };
    "setting:shoutout_message": {
        shoutout_message: string;
        shoutout_not_found: string;
        shoutout_failed: string;
    };
    "setting:shoutout:alert:length": { mode: string; value: number };
    "setting:notification:sound": "chatter" | "host" | "chat" | "raid";
    "setting:notification:volume": {
        mode: "chatter_volume" | "chat_volume" | "raid_volume" | "host_volume";
        value: number;
    };
    "setting:notification:play": "chatter" | "chat" | "raid" | "host";
    usermemo: Record<string, never>;
    "usermemo:one": string;
    "usermemo:store": RequestUserMemoType;
    "usermemo:delete": string;
};

export type ReturnsType = {
    "bot:connect": null;
    "bot:disconnect": null;
    "bot:shoutout": null;
    "channel:info": ChannelType;
    "channel:game": GameType;
    "channel:games": GameType[];
    "channel:tags": TagType[];
    "channel:update": null;
    "channel:template": ChannelTemplateType[];
    "channel:template:push": ChannelTemplateType[];
    "channel:template:delete": ChannelTemplateType[];
    chatter: ChatterType[];
    "chatter:delete": ChatterType[];
    host: HostType[];
    "host:delete": HostType[];
    "get:init": boolean;
    signout: null;
    raider: RaiderType[];
    "raider:delete": RaiderType[];
    "server:init": {
        isConnected: boolean;
        httpPort: number;
        socketPort: number;
    };
    "server:create": boolean;
    "server:close": boolean;
    "server:port:update": number;
    "setting:locale": string;
    "setting:locale:update": string;
    "setting:get": SettingType;
    "setting:store": { username: string; channel: string };
    "setting:shoutout_message": {
        shoutout_message: string;
        shoutout_not_found: string;
        shoutout_failed: string;
    };
    "setting:shoutout:alert:length": number | null;
    "setting:notification:sound": boolean;
    "setting:notification:volume": number;
    "setting:notification:play": boolean;
    usermemo: UserMemoType[];
    "usermemo:one": UserMemoType;
    "usermemo:store": UserMemoType[];
    "usermemo:delete": UserMemoType[];
};
