export type ResponseSettingType = {
    username: string;
    channel: string;
    shoutout_message: string;
    shoutout_not_found: string;
    shoutout_failed: string;
    chatter_volume: number;
    raid_volume: number;
    host_volume: number;
};

export type RequestSettingType = {
    channel: string;
};
