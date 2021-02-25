import React from "react";
import { useRecoilState, useSetRecoilState } from "recoil";

// Recoil
import ShoutOutMessageState from "../atom/SettingShoutOutMessage";
import ShoutOutNotFoundState from "../atom/SettingShoutOutNotFound";
import ShoutOutFailedState from "../atom/SettingShoutOutFailed";
import IsConnectingState from "../atom/IsConnecting";

// Utils
import { request } from "../util/request";

const SettingBotComponent: React.FC = () => {
    const [shoutOutMessage, updateShoutOutMessage] = useRecoilState(
        ShoutOutMessageState
    );
    const [shoutOutNotFound, updateShoutOutNotFound] = useRecoilState(
        ShoutOutNotFoundState
    );
    const [shoutOutFailed, updateShoutOutFailed] = useRecoilState(
        ShoutOutFailedState
    );
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        updateIsConnecting(true);

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

        updateIsConnecting(false);
    };

    return (
        <section className="my-4">
            <h3>Shoutout Message</h3>

            <div className="row">
                <form
                    className="col-md-8 mb-3 mb-md-0"
                    onSubmit={submitHandler}
                >
                    <div className="mb-3">
                        <label htmlFor="shoutout_message">
                            ShoutOut Message
                        </label>
                        <textarea
                            name="shoutout_message"
                            id="shoutout_message"
                            rows={3}
                            className="form-control"
                            value={shoutOutMessage}
                            onChange={(e) =>
                                updateShoutOutMessage(e.target.value)
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
                                updateShoutOutNotFound(e.target.value)
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
                                updateShoutOutFailed(e.target.value)
                            }
                        ></textarea>
                    </div>

                    <button className="btn btn-primary">
                        <i className="bi bi-archive me-2"></i>
                        Save
                    </button>
                </form>

                <div className="col-md-4">
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
                </div>
            </div>
        </section>
    );
};

export default SettingBotComponent;
