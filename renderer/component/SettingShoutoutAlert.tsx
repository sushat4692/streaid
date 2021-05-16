import React, { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import cn from "classnames";

// Components
import SettingShoutoutAlertInfoComponent from "./SettingShoutoutAlertInfo";
import SettingShoutoutAlertClipComponent from "./SettingShoutoutAlertClip";
import CopyableFieldComponent from "./CopyableField";

// Utils
import { request } from "../util/request";

// Styles
import styles from "./SettingShoutoutAlert.module.css";

const SettingShoutoutAlert: React.FC = () => {
    const [isConnected, updateIsConnected] = useState(false);
    const [httpPort, updateHttpPort] = useState<number>(0);
    const [specifiedHttpPort, updateSpecifiedHttpPort] = useState<number>(0);
    const [socketPort, updateSocketPort] = useState<number>(0);
    const [specifiedSocketPort, updateSpecifiedSocketPort] =
        useState<number>(0);
    const intl = useIntl();

    const submitHttpPort = async () => {
        const port = await request(
            "server:port:update",
            { mode: "http", value: httpPort },
            9900
        );

        updateSpecifiedHttpPort(port);
    };

    const submitSocketPort = async () => {
        const port = await request(
            "server:port:update",
            { mode: "socket", value: socketPort },
            9900
        );

        updateSpecifiedSocketPort(port);
    };

    const toggleAlertServer = async () => {
        const newConnected = await (async () => {
            if (isConnected) {
                return await request("server:close", {}, false);
            } else {
                return await request("server:create", {}, true);
            }
        })();

        updateIsConnected(newConnected);
    };

    useEffect(() => {
        (async () => {
            const inited = await request(
                "server:init",
                {},
                {
                    isConnected: false,
                    httpPort: 9990,
                    socketPort: 9999,
                }
            );

            updateIsConnected(inited.isConnected);
            updateHttpPort(inited.httpPort);
            updateSpecifiedHttpPort(inited.httpPort);
            updateSocketPort(inited.socketPort);
            updateSpecifiedSocketPort(inited.socketPort);
        })();
    }, []);

    return (
        <>
            <section className="section">
                <h2 className="section__header">
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.URL.Header"
                        defaultMessage="Shoutout Alert"
                    />
                </h2>

                <div className="form-field">
                    <label className="form-field__label">
                        <FormattedMessage
                            id="Component.SettingShoutOutAlert.Port.Http.Label"
                            defaultMessage="HTTP Port (For embed URL for OBS)"
                        />
                    </label>

                    <div className="form-control-group">
                        <input
                            type="text"
                            className="form-control"
                            value={httpPort}
                            onChange={(e) =>
                                updateHttpPort(parseInt(e.target.value, 10))
                            }
                        />

                        <button className="btn" onClick={submitHttpPort}>
                            <FormattedMessage
                                id="Common.Apply"
                                defaultMessage="Apply"
                            />
                        </button>
                    </div>
                </div>

                <div className="form-field">
                    <label className="form-field__label">
                        <FormattedMessage
                            id="Component.SettingShoutOutAlert.Port.Socket.Label"
                            defaultMessage="Socket Port"
                        />
                    </label>

                    <div className="form-control-group">
                        <input
                            type="text"
                            className="form-control"
                            value={socketPort}
                            onChange={(e) =>
                                updateSocketPort(parseInt(e.target.value, 10))
                            }
                        />

                        <button className="btn" onClick={submitSocketPort}>
                            <FormattedMessage
                                id="Common.Apply"
                                defaultMessage="Apply"
                            />
                        </button>
                    </div>
                </div>

                <div className={styles.connect}>
                    <button
                        className={cn({
                            btn: true,
                            "is-large": true,
                            "is-primary": !isConnected,
                            "is-danger": isConnected,
                        })}
                        onClick={toggleAlertServer}
                    >
                        {isConnected
                            ? intl.formatMessage({
                                  id: "Component.SettingShoutOutAlert.Server.Stop",
                                  defaultMessage: "Stop Alert Server",
                              })
                            : intl.formatMessage({
                                  id: "Component.SettingShoutOutAlert.Server.Start",
                                  defaultMessage: "Start Alert Server",
                              })}
                    </button>
                </div>
            </section>

            <section className="section">
                <h3 className="section__sub-header">
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.Port.Http.Header"
                        defaultMessage="Embed"
                    />

                    <small className="section__sub-header__small">
                        <FormattedMessage
                            id="Component.SettingShoutOutAlert.Port.Http.Descript"
                            defaultMessage="Embed information to Streaming Tool"
                        />
                    </small>
                </h3>

                <div className="alert">
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.URL.Descript"
                        defaultMessage='Please copy & Pase the following URL and embed "Browser" to your streaming tool (e.g. OBS)'
                    />
                </div>

                <CopyableFieldComponent
                    text={`http://localhost:${specifiedHttpPort}/?socket=${specifiedSocketPort}`}
                    isLarge
                ></CopyableFieldComponent>
            </section>

            <section className="section">
                <SettingShoutoutAlertInfoComponent></SettingShoutoutAlertInfoComponent>
                <SettingShoutoutAlertClipComponent></SettingShoutoutAlertClipComponent>
            </section>
        </>
    );
};

export default SettingShoutoutAlert;
