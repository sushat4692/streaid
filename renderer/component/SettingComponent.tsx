import React, { useEffect, useState } from "react";

import AppStore, { Action } from "../store/App";

const SettnigComponent: React.FC = () => {
    const [username, updateUsername] = useState("");
    const [channels, updateChannels] = useState("");

    AppStore.subscribe(() => {
        updateUsername(AppStore.getState().username);
        updateChannels(AppStore.getState().channels);
    });

    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();

        AppStore.dispatch({ type: Action.START_CONNECTING });

        const submitChannels = channels.split(",");
        await window.saveSettings({ channels: submitChannels });

        AppStore.dispatch({ type: Action.STOP_CONNECTING });
    };
    const signoutHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        AppStore.dispatch({ type: Action.START_CONNECTING });

        await window.signOut();

        AppStore.dispatch({ type: Action.STOP_CONNECTING });

        AppStore.dispatch({ type: Action.UPDATE, state: { isInited: false } });
    };

    useEffect(() => {
        (async () => {
            AppStore.dispatch({ type: Action.START_CONNECTING });

            const defaultValue = await (async () => {
                if (typeof window.getSettings === "function") {
                    return await window.getSettings();
                } else {
                    return {
                        username: "",
                        channels: [],
                    };
                }
            })();

            AppStore.dispatch({
                type: Action.UPDATE,
                state: {
                    username: defaultValue.username,
                    channels: defaultValue.channels.join(","),
                },
            });

            AppStore.dispatch({ type: Action.STOP_CONNECTING });
        })();
    }, []);

    return (
        <section className="mt-4">
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
                            AppStore.dispatch({
                                type: Action.UPDATE,
                                state: { channels: e.target.value },
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

export default SettnigComponent;
