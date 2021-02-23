import React, { useEffect, useState } from "react";

// Type
import {
    RequestSettingType,
    ResponseSettingType,
} from "../../types/SettingType";

// Store
import {
    getState as getUsername,
    subscribe as subscribeUsernameStore,
} from "../store/SettingUsername";
import {
    getState as getChannel,
    subscribe as subscribeChannelStore,
    updateAction as updateChannelStore,
} from "../store/SettingChannel";
import { disableAction as disableIsInited } from "../store/IsInited";
import {
    enableAction as enableIsConnected,
    disableAction as disableIsConnected,
} from "../store/IsConnecting";

// Utils
import { request } from "../util/request";

const SettingBotComponent: React.FC = () => {
    const [username, updateUsername] = useState(getUsername());
    const [channel, updateChannel] = useState(getChannel());

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        enableIsConnected();

        await request<RequestSettingType, ResponseSettingType>(
            "settings:store",
            {
                channel,
            },
            null
        );

        disableIsConnected();
    };
    const signoutHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        enableIsConnected();

        await request("signout", null, null);

        disableIsInited();
        disableIsConnected();
    };

    useEffect(() => {
        subscribeUsernameStore(() => {
            updateUsername(getUsername());
        });
        subscribeChannelStore(() => {
            updateChannel(getChannel());
        });
    }, []);

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
                        onChange={(e) => updateChannelStore(e.target.value)}
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
