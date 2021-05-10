export type SettingType = {
    username: string;
    channel: string;
    shoutout_message: string;
    shoutout_not_found: string;
    shoutout_failed: string;
    shoutout_info_length: number;
    chatter_volume: number;
    chat_volume: number;
    raid_volume: number;
    host_volume: number;
};

export type RequestSettingType = {
    channel: string;
};
