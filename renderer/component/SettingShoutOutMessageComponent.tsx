import React, { useEffect, useState } from "react";

// Store
import SettingShoutOutMessageStore from "../store/SettingShoutOutMessage";
import SettingShoutOutNotFoundStore from "../store/SettingShoutOutNotFound";
import SettingShoutOutFailedStore from "../store/SettingShoutOutFailed";
import IsConnectingStore from "../store/IsConnecting";

// Utils
import { request } from "../util/request";

const SettingBotComponent: React.FC = () => {
    const [shoutOutMessage, updateShoutOutMessage] = useState(
        SettingShoutOutMessageStore.getState()
    );
    const [shoutOutNotFound, updateShoutOutNotFound] = useState(
        SettingShoutOutNotFoundStore.getState()
    );
    const [shoutOutFailed, updateShoutOutFailed] = useState(
        SettingShoutOutFailedStore.getState()
    );

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        IsConnectingStore.dispatch({ type: "ENABLE" });

        await request<
            {
                shoutout_message: string;
                shoutout_not_found: string;
                shoutout_failed: string;
            },
            null
        >(
            "setting:shoutout_message",
            {
                shoutout_message: shoutOutMessage,
                shoutout_not_found: shoutOutNotFound,
                shoutout_failed: shoutOutFailed,
            },
            null
        );

        IsConnectingStore.dispatch({ type: "DISABLE" });
    };

    useEffect(() => {
        SettingShoutOutMessageStore.subscribe(() => {
            updateShoutOutMessage(SettingShoutOutMessageStore.getState());
        });
        SettingShoutOutNotFoundStore.subscribe(() => {
            updateShoutOutNotFound(SettingShoutOutNotFoundStore.getState());
        });
        SettingShoutOutFailedStore.subscribe(() => {
            updateShoutOutFailed(SettingShoutOutFailedStore.getState());
        });
    }, []);

    return (
        <section className="my-4">
            <h2>Shoutout Message</h2>

            <form className="mb-3" onSubmit={submitHandler}>
                <div className="mb-3">
                    <label htmlFor="shoutout_message">ShoutOut Message</label>
                    <textarea
                        name="shoutout_message"
                        id="shoutout_message"
                        rows={3}
                        className="form-control"
                        value={shoutOutMessage}
                        onChange={(e) =>
                            SettingShoutOutMessageStore.dispatch({
                                type: "UPDATE",
                                state: e.target.value,
                            })
                        }
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label htmlFor="shoutout_failed">Failed Message</label>
                    <textarea
                        name="shoutout_failed"
                        id="shoutout_failed"
                        rows={3}
                        className="form-control"
                        value={shoutOutFailed}
                        onChange={(e) =>
                            SettingShoutOutFailedStore.dispatch({
                                type: "UPDATE",
                                state: e.target.value,
                            })
                        }
                    ></textarea>
                </div>

                <div className="mb-3">
                    <label htmlFor="shoutout_not_found">
                        Not Found Message
                    </label>
                    <textarea
                        name="shoutout_not_found"
                        id="shoutout_not_found"
                        rows={3}
                        className="form-control"
                        value={shoutOutNotFound}
                        onChange={(e) =>
                            SettingShoutOutNotFoundStore.dispatch({
                                type: "UPDATE",
                                state: e.target.value,
                            })
                        }
                    ></textarea>
                </div>

                <button className="btn btn-primary">Save</button>
            </form>

            <table className="table">
                <colgroup>
                    <col width="120" />
                    <col />
                </colgroup>
                <thead>
                    <tr>
                        <th scope="col">Variable</th>
                        <th scope="col">Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td scope="row">
                            <code>%url%</code>
                        </td>
                        <td>Target Channel URL</td>
                    </tr>
                    <tr>
                        <td scope="row">
                            <code>%username%</code>
                        </td>
                        <td>Target User Display Name</td>
                    </tr>
                    <tr>
                        <td scope="row">
                            <code>%user_id%</code>
                        </td>
                        <td>Target User ID</td>
                    </tr>
                    <tr>
                        <td scope="row">
                            <code>%category%</code>
                        </td>
                        <td>Target Category/Game name</td>
                    </tr>
                </tbody>
            </table>
        </section>
    );
};

export default SettingBotComponent;
