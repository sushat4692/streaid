import React from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import TextareaAutosize from "react-textarea-autosize";

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
            <h3>
                <FormattedMessage
                    id="Component.SettingShoutOutMessage.Header"
                    defaultMessage="Shoutout Message"
                />
            </h3>

            <div className="row">
                <form
                    className="col-md-8 mb-3 mb-md-0"
                    onSubmit={submitHandler}
                >
                    <div className="mb-3">
                        <label htmlFor="shoutout_message" className="mb-1">
                            <FormattedMessage
                                id="Component.SettingShoutOutMessage.Message"
                                defaultMessage="ShoutOut Message Template"
                            />
                        </label>
                        <TextareaAutosize
                            name="shoutout_message"
                            id="shoutout_message"
                            rows={3}
                            className="form-control"
                            value={shoutOutMessage}
                            onChange={(e) =>
                                updateShoutOutMessage(e.target.value)
                            }
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="shoutout_failed" className="mb-1">
                            <FormattedMessage
                                id="Component.SettingShoutOutMessage.Failed"
                                defaultMessage="Failed Message Template"
                            />
                        </label>
                        <TextareaAutosize
                            name="shoutout_failed"
                            id="shoutout_failed"
                            rows={3}
                            className="form-control"
                            value={shoutOutFailed}
                            onChange={(e) =>
                                updateShoutOutFailed(e.target.value)
                            }
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="shoutout_not_found" className="mb-1">
                            <FormattedMessage
                                id="Component.SettingShoutOutMessage.NotFound"
                                defaultMessage="Not Found Message Template"
                            />
                        </label>
                        <TextareaAutosize
                            name="shoutout_not_found"
                            id="shoutout_not_found"
                            rows={3}
                            className="form-control"
                            value={shoutOutNotFound}
                            onChange={(e) =>
                                updateShoutOutNotFound(e.target.value)
                            }
                        />
                    </div>

                    <button className="btn btn-primary">
                        <i className="bi bi-archive me-2"></i>
                        <FormattedMessage
                            id="Common.Submit"
                            defaultMessage="Submit"
                        />
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
                                <th scope="col">
                                    <FormattedMessage
                                        id="Common.Variable.Variable"
                                        defaultMessage="Variable"
                                    />
                                </th>
                                <th scope="col">
                                    <FormattedMessage
                                        id="Common.Variable.Description"
                                        defaultMessage="Description"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td scope="row">
                                    <code>%url%</code>
                                </td>
                                <td>
                                    <FormattedMessage
                                        id="Common.Variable.Url.Description"
                                        defaultMessage="Target Channel URL"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td scope="row">
                                    <code>%username%</code>
                                </td>
                                <td>
                                    <FormattedMessage
                                        id="Common.Variable.Username.Description"
                                        defaultMessage="Target User Display Name"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td scope="row">
                                    <code>%user_id%</code>
                                </td>
                                <td>
                                    <FormattedMessage
                                        id="Common.Variable.UserId.Description"
                                        defaultMessage="Target User ID"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td scope="row">
                                    <code>%category%</code>
                                </td>
                                <td>
                                    <FormattedMessage
                                        id="Common.Variable.Category.Description"
                                        defaultMessage="Target Category/Game name"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default SettingBotComponent;
