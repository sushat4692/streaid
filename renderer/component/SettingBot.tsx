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

// Styles
import styles from "./SettingBot.module.css";

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
        <section className="section">
            <h2 className="section__header">
                <FormattedMessage
                    id="Component.SettingBot.Header"
                    defaultMessage="Bot Target Channel"
                />
            </h2>

            <div className={styles.row}>
                <div className="form-field">
                    <label htmlFor="username" className="form-field__label">
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
                <div className="form-field">
                    <label htmlFor="channel" className="form-field__label">
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
                    <p className="form-field__help">
                        <FormattedMessage
                            id="Component.SettingBot.ChannelHelp"
                            defaultMessage="* If you set same channel with username, you can update channel information"
                        />
                    </p>
                </div>
            </div>

            <div className="form-field__action is-end">
                <button className="btn is-danger" onClick={signoutHandler}>
                    <i className="bi bi-box-arrow-in-right btn__icon" />
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
