import React, { useEffect, useState } from "react";

// Type
import {
    RequestSettingType,
    ResponseSettingType,
} from "../../types/SettingType";

// Store
import SettingUsernameStore from "../store/SettingUsername";
import SettingChannelsStore from "../store/SettingChannels";
import IsInitedStore from "../store/IsInited";
import IsConnectingStore from "../store/IsConnecting";

// Utils
import { request } from "../util/request";

const SettnigPage: React.FC = () => {
    const [username, updateUsername] = useState(
        SettingUsernameStore.getState()
    );
    const [channels, updateChannels] = useState(
        SettingChannelsStore.getState()
    );

    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();

        IsConnectingStore.dispatch({ type: "ENABLE" });

        const submitChannels = channels.split(",");
        await request<RequestSettingType, ResponseSettingType>(
            "save:settings",
            {
                channels: submitChannels,
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
        SettingChannelsStore.subscribe(() => {
            updateChannels(SettingChannelsStore.getState());
        });
    }, []);

    return (
        <section className="my-4">
            <form onSubmit={saveSettings}>
                <h2>Settings</h2>
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
                    <label htmlFor="channels" className="form-label">
                        Channels
                    </label>
                    <input
                        type="text"
                        name="channels"
                        id="channels"
                        className="form-control"
                        value={channels}
                        onChange={(e) =>
                            SettingChannelsStore.dispatch({
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

export default SettnigPage;
