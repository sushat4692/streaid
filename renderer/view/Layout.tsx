import React, { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

// Type
import { ResponseSettingType } from "../../types/SettingType";

// Recoil
import SettingUsernameState from "../atom/SettingUsername";
import SettingChannelState from "../atom/SettingChannel";
import ShoutOutMessageState from "../atom/SettingShoutOutMessage";
import ShoutOutNotFoundState from "../atom/SettingShoutOutNotFound";
import ShoutOutFailedState from "../atom/SettingShoutOutFailed";
import SoundChatterVolumeState from "../atom/SoundChatterVolume";
import SoundChatVolumeState from "../atom/SoundChatVolume";
import SoundRaidVolumeState from "../atom/SoundRaidVolume";
import SoundHostVolumeState from "../atom/SoundHostVolume";
import IsConnectingState from "../atom/IsConnecting";

// Component
import HeaderComponent from "../component/Header";
import NeedSettingPage from "../page/NeedSetting";
import DashboardPage from "../page/Dashboard";
import ChattersPage from "../page/Chatters";
import RaidersPage from "../page/Raiders";
import HostsPage from "../page/Hosts";
import ChannelPage from "../page/Channel";
import UserMemoPage from "../page/UserMemo";
import SettingPage from "../page/Setting";
import LicensePage from "../page/License";

// Utils
import { request } from "../util/request";
import { useSettingState } from "../util/setting";

const Layout: React.FC = () => {
    const setting = useSettingState();

    const updateSettingUsername = useSetRecoilState(SettingUsernameState);
    const updateSettingChannel = useSetRecoilState(SettingChannelState);
    const updateShoutOutMessage = useSetRecoilState(ShoutOutMessageState);
    const updateShoutOutNotFound = useSetRecoilState(ShoutOutNotFoundState);
    const updateShoutOutFailed = useSetRecoilState(ShoutOutFailedState);
    const updateSoundChatterVolume = useSetRecoilState(SoundChatterVolumeState);
    const updateSoundChatVolume = useSetRecoilState(SoundChatVolumeState);
    const updateSoundRaidVolume = useSetRecoilState(SoundRaidVolumeState);
    const updateSoundHostVolume = useSetRecoilState(SoundHostVolumeState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    useEffect(() => {
        (async () => {
            updateIsConnecting(true);

            const defaultValue = await request<null, ResponseSettingType>(
                "settings:get",
                null,
                {
                    username: "",
                    channel: "",
                    shoutout_message: "",
                    shoutout_not_found: "",
                    shoutout_failed: "",
                    chatter_volume: 1,
                    chat_volume: 1,
                    raid_volume: 1,
                    host_volume: 1,
                }
            );

            updateSettingUsername(defaultValue.username);
            updateSettingChannel(defaultValue.channel);
            updateShoutOutMessage(defaultValue.shoutout_message);
            updateShoutOutNotFound(defaultValue.shoutout_not_found);
            updateShoutOutFailed(defaultValue.shoutout_failed);
            updateSoundChatterVolume(defaultValue.chatter_volume);
            updateSoundChatVolume(defaultValue.chat_volume);
            updateSoundRaidVolume(defaultValue.raid_volume);
            updateSoundHostVolume(defaultValue.host_volume);

            updateIsConnecting(false);
        })();
    }, []);

    return (
        <Router>
            <HeaderComponent />

            <div className="container-fluid">
                <main>
                    {setting.isEnableBot ? (
                        <Switch>
                            <Route path="/chatters">
                                <ChattersPage />
                            </Route>
                            <Route path="/raiders">
                                <RaidersPage />
                            </Route>
                            <Route path="/hosts">
                                <HostsPage />
                            </Route>
                            <Route path="/channel">
                                <ChannelPage />
                            </Route>
                            <Route path="/user_memo">
                                <UserMemoPage />
                            </Route>
                            <Route path="/settings">
                                <SettingPage />
                            </Route>
                            <Route path="/license">
                                <LicensePage />
                            </Route>
                            <Route path="/">
                                <DashboardPage />
                            </Route>
                        </Switch>
                    ) : (
                        <Switch>
                            <Route path="/settings">
                                <SettingPage />
                            </Route>
                            <Route path="/license">
                                <LicensePage />
                            </Route>
                            <Route path="/">
                                <NeedSettingPage />
                            </Route>
                        </Switch>
                    )}
                </main>
            </div>
        </Router>
    );
};

export default Layout;
