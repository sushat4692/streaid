export type BadgeType = {
    admin?: string;
    bits?: string;
    broadcaster?: string;
    partner?: string;
    global_mod?: string;
    moderator?: string;
    vip?: string;
    subscriber?: string;
    staff?: string;
    turbo?: string;
    premium?: string;
    founder?: string;
    ["bits-leader"]?: string;
    ["sub-gifter"]?: string;
    [other: string]: string | undefined;
};

export type BadgeInfoType = {
    subscriber?: string;
    [other: string]: string | undefined;
};
