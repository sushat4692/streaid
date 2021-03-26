import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Type
import {
    RequestSettingType,
    ResponseSettingType,
} from "../../types/SettingType";

// Recoil
import SettingUsernameState from "../atom/SettingUsername";
import SettingChannelState from "../atom/SettingChannel";
import IsInitedState from "../atom/IsInited";
import IsConnectingState from "../atom/IsConnecting";

// Utils
import { request } from "../util/request";

const SettingBotComponent: React.FC = () => {
    const username = useRecoilValue(SettingUsernameState);
    const [channel, updateChannel] = useRecoilState(SettingChannelState);
    const updateIsInited = useSetRecoilState(IsInitedState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    useEffect(() => {
        request<RequestSettingType, ResponseSettingType>(
            "settings:store",
            {
                channel,
            },
            null
        );
    }, [username, channel]);

    const signoutHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        updateIsConnecting(true);

        await request("signout", null, null);

        updateIsInited(false);
        updateIsConnecting(false);
    };

    return (
        <section className="my-4">
            <h3>
                <FormattedMessage
                    id="Component.SettingBot.Header"
                    defaultMessage="Bot Target Channel"
                />
            </h3>

            <div className="mb-3">
                <label htmlFor="username" className="form-label">
                    <FormattedMessage
                        id="Common.Label.Username"
                        defaultMessage="Username"
                    />
                </label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    className="form-control"
                    value={username}
                    readOnly
                />
            </div>
            <div className="mb-3">
                <label htmlFor="channel" className="form-label">
                    <FormattedMessage
                        id="Common.Label.Channel"
                        defaultMessage="Channel"
                    />
                </label>
                <input
                    type="text"
                    name="channel"
                    id="channel"
                    className="form-control"
                    value={channel}
                    onChange={(e) => updateChannel(e.target.value)}
                />
                <p className="form-text">
                    <FormattedMessage
                        id="Component.SettingBot.ChannelHelp"
                        defaultMessage="* If you set same channel with username, you can update channel information"
                    />
                </p>
            </div>

            <div className="d-flex justify-content-end">
                <button className="btn btn-danger" onClick={signoutHandler}>
                    <i className="bi bi-box-arrow-in-right me-2" />
                    <FormattedMessage
                        id="Common.SignOut"
                        defaultMessage="Signout"
                    />
                </button>
            </div>
        </section>
    );
};

export default SettingBotComponent;
