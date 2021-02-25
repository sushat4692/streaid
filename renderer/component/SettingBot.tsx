import React from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";

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

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        updateIsConnecting(true);

        await request<RequestSettingType, ResponseSettingType>(
            "settings:store",
            {
                channel,
            },
            null
        );

        updateIsConnecting(false);
    };
    const signoutHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        updateIsConnecting(true);

        await request("signout", null, null);

        updateIsInited(false);
        updateIsConnecting(false);
    };

    return (
        <section className="my-4">
            <h3>Bot Target Channel</h3>

            <form onSubmit={submitHandler}>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                        Username
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
                        Channels
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
                        * You can add multiple channnels separated by comma (,)
                    </p>
                </div>

                <div className="d-flex justify-content-between">
                    <button className="btn btn-primary">
                        <i className="bi bi-archive me-2"></i>
                        Save
                    </button>
                    <button className="btn btn-danger" onClick={signoutHandler}>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Signout
                    </button>
                </div>
            </form>
        </section>
    );
};

export default SettingBotComponent;
