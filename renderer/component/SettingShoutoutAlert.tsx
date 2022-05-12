import React, { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import tw from "twin.macro";

// Components
import SettingShoutoutAlertInfo from "./SettingShoutoutAlertInfo";
import SettingShoutoutAlertClip from "./SettingShoutoutAlertClip";
import CopyableFieldComponent from "./CopyableField";
import Section from "../../component/Section";
import SectionHeader from "../../component/SectionHeader";
import SectionSubHeader from "../../component/SectionSubHeader";
import SectionSubHeaderSmall from "../../component/SectionSubHeaderSmall";
import FormField from "./FormField";
import FormFieldLabel from "./FormFieldLabel";
import FormGroup from "./FormGroup";
import FormInputText from "./FormInputText";
import Button from "../../component/Button";
import Alert from "../../component/Alert";
const Connect = tw.div`mb-2`;

// Utils
import { request } from "../util/request";

const SettingShoutoutAlert: React.FC = () => {
    const [isConnected, updateIsConnected] = useState(false);
    const [httpPort, updateHttpPort] = useState<number>(0);
    const [specifiedHttpPort, updateSpecifiedHttpPort] = useState<number>(0);
    const [socketPort, updateSocketPort] = useState<number>(0);
    const [specifiedSocketPort, updateSpecifiedSocketPort] =
        useState<number>(0);
    const intl = useIntl();

    const submitHttpPort = useCallback(async () => {
        const port = await request(
            "server:port:update",
            { mode: "http", value: httpPort },
            9900
        );

        updateSpecifiedHttpPort(port);
    }, [httpPort]);

    const submitSocketPort = useCallback(async () => {
        const port = await request(
            "server:port:update",
            { mode: "socket", value: socketPort },
            9900
        );

        updateSpecifiedSocketPort(port);
    }, [socketPort]);

    const toggleAlertServer = useCallback(async () => {
        const newConnected = await (async () => {
            if (isConnected) {
                return await request("server:close", {}, false);
            } else {
                return await request("server:create", {}, true);
            }
        })();

        updateIsConnected(newConnected);
    }, [isConnected]);

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
            <Section>
                <SectionHeader>
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.URL.Header"
                        defaultMessage="Shoutout Alert"
                    />
                </SectionHeader>

                <FormField>
                    <FormFieldLabel>
                        <FormattedMessage
                            id="Component.SettingShoutOutAlert.Port.Http.Label"
                            defaultMessage="HTTP Port (For embed URL for OBS)"
                        />
                    </FormFieldLabel>

                    <FormGroup>
                        <FormInputText
                            type="text"
                            value={httpPort}
                            onChange={(e) =>
                                updateHttpPort(parseInt(e.target.value, 10))
                            }
                        />

                        <Button onClick={submitHttpPort}>
                            <FormattedMessage
                                id="Common.Apply"
                                defaultMessage="Apply"
                            />
                        </Button>
                    </FormGroup>
                </FormField>

                <FormField>
                    <FormFieldLabel>
                        <FormattedMessage
                            id="Component.SettingShoutOutAlert.Port.Socket.Label"
                            defaultMessage="Socket Port"
                        />
                    </FormFieldLabel>

                    <FormGroup>
                        <FormInputText
                            type="text"
                            value={socketPort}
                            onChange={(e) =>
                                updateSocketPort(parseInt(e.target.value, 10))
                            }
                        />

                        <Button onClick={submitSocketPort}>
                            <FormattedMessage
                                id="Common.Apply"
                                defaultMessage="Apply"
                            />
                        </Button>
                    </FormGroup>
                </FormField>

                <Connect>
                    <Button
                        size="large"
                        color={isConnected ? "danger" : "primary"}
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
                    </Button>
                </Connect>
            </Section>

            <Section>
                <SectionSubHeader>
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.Port.Http.Header"
                        defaultMessage="Embed"
                    />

                    <SectionSubHeaderSmall>
                        <FormattedMessage
                            id="Component.SettingShoutOutAlert.Port.Http.Descript"
                            defaultMessage="Embed information to Streaming Tool"
                        />
                    </SectionSubHeaderSmall>
                </SectionSubHeader>

                <Alert>
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.URL.Descript"
                        defaultMessage='Please copy & Pase the following URL and embed "Browser" to your streaming tool (e.g. OBS)'
                    />
                </Alert>

                <CopyableFieldComponent
                    text={`http://localhost:${specifiedHttpPort}/?socket=${specifiedSocketPort}`}
                    isLarge
                ></CopyableFieldComponent>
            </Section>

            <Section>
                <SettingShoutoutAlertInfo></SettingShoutoutAlertInfo>
                <SettingShoutoutAlertClip></SettingShoutoutAlertClip>
            </Section>
        </>
    );
};

export default SettingShoutoutAlert;
