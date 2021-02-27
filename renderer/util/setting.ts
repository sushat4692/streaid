import { useState, useEffect } from "react";
import { useRecoilValue } from "recoil";

// Recoil
import SettingUsernameState from "../atom/SettingUsername";
import SettingChannelState from "../atom/SettingChannel";

export const useSettingState = () => {
    const username = useRecoilValue(SettingUsernameState);
    const channel = useRecoilValue(SettingChannelState);

    const [isEnableBot, updateIsEnableBot] = useState<boolean>(
        channel.length > 0
    );
    const [isEnableChannel, updateIsEnableChannel] = useState<boolean>(
        channel.length > 0 && username === channel
    );

    useEffect(() => {
        updateIsEnableBot(channel.length > 0);
        updateIsEnableChannel(channel.length > 0 && username === channel);
    }, [username, channel]);

    return {
        isEnableBot,
        isEnableChannel,
    };
};
