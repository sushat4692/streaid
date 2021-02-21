import React, { useEffect, useState } from "react";

// Type
import {
    RequestSettingType,
    ResponseSettingType,
} from "../../types/SettingType";

// Store
import SettingUsernameStore from "../store/SettingUsername";
import SettingChannelStore from "../store/SettingChannel";
import IsInitedStore from "../store/IsInited";
import IsConnectingStore from "../store/IsConnecting";

// Utils
import { request } from "../util/request";

const SettingBotComponent: React.FC = () => {
    const [username, updateUsername] = useState(
        SettingUsernameStore.getState()
    );
    const [channel, updateChannel] = useState(SettingChannelStore.getState());

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        IsConnectingStore.dispatch({ type: "ENABLE" });

        await request<RequestSettingType, ResponseSettingType>(
            "settings:store",
            {
                channel,
            },
            null
        );

        IsConnectingStore.dispatch({ type: "DISABLE" });
    };
    const signoutHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        IsConnectingStore.dispatch({ type: "ENABLE" });

        await request("signout", null, null);

        IsInitedStore.dispatch({ type: "DISABLE" });
        IsConnectingStore.dispatch({ type: "DISABLE" });
    };

    useEffect(() => {
        SettingUsernameStore.subscribe(() => {
            updateUsername(SettingUsernameStore.getState());
        });
        SettingChannelStore.subscribe(() => {
            updateChannel(SettingChannelStore.getState());
        });
    }, []);

    return (
        <section className="my-4">
            <h2>Settings</h2>

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
                        onChange={(e) =>
                            SettingChannelStore.dispatch({
                                type: "UPDATE",
                                state: e.target.value,
                            })
                        }
                    />
                    <p className="form-text">
                        * You can add multiple channnels separated by comma (,)
                    </p>
                </div>
                <button className="btn btn-primary me-2">Save</button>
                <button className="btn btn-danger" onClick={signoutHandler}>
                    Signout
                </button>
            </form>
        </section>
    );
};

export default SettingBotComponent;
