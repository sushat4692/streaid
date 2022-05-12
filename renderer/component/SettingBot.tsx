import React, { useCallback, useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import SettingUsernameState from "../atom/SettingUsername";
import SettingChannelState from "../atom/SettingChannel";
import IsInitedState from "../atom/IsInited";
import IsConnectingState from "../atom/IsConnecting";

// Utils
import { request } from "../util/request";

// Components
import Section from "../../component/Section";
import SectionHeader from "../../component/SectionHeader";
import Row from "./Row";
import FormField from "./FormField";
import FormFieldLabel from "./FormFieldLabel";
import FormInputText from "./FormInputText";
import FormFieldHelp from "./FormFieldHelp";
import FormFieldAction from "./FormFieldAction";
import Button from "../../component/Button";
import ButtonIcon from "../../component/ButtonIcon";

const SettingBotComponent: React.FC = () => {
    const username = useRecoilValue(SettingUsernameState);
    const [channel, updateChannel] = useRecoilState(SettingChannelState);
    const updateIsInited = useSetRecoilState(IsInitedState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    useEffect(() => {
        request(
            "setting:store",
            {
                channel,
            },
            null
        );
    }, [username, channel]);

    const signoutHandler = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        updateIsConnecting(true);

        await request("signout", null, null);

        updateIsInited(false);
        updateIsConnecting(false);
    }, []);

    return (
        <Section>
            <SectionHeader>
                <FormattedMessage
                    id="Component.SettingBot.Header"
                    defaultMessage="Target Channel"
                />
            </SectionHeader>

            <Row col={2}>
                <FormField>
                    <FormFieldLabel htmlFor="username">
                        <FormattedMessage
                            id="Common.Label.Username"
                            defaultMessage="Username"
                        />
                    </FormFieldLabel>
                    <FormInputText
                        type="text"
                        name="username"
                        id="username"
                        value={username}
                        readOnly
                    />
                </FormField>
                <FormField>
                    <FormFieldLabel htmlFor="channel">
                        <FormattedMessage
                            id="Common.Label.Channel"
                            defaultMessage="Channel"
                        />
                    </FormFieldLabel>
                    <FormInputText
                        type="text"
                        name="channel"
                        id="channel"
                        value={channel}
                        onChange={(e) => updateChannel(e.target.value)}
                    />
                    <FormFieldHelp>
                        <FormattedMessage
                            id="Component.SettingBot.ChannelHelp"
                            defaultMessage="* If you set same channel with username, you can update channel information"
                        />
                    </FormFieldHelp>
                </FormField>
            </Row>

            <FormFieldAction isEnd={true}>
                <Button color="danger" onClick={signoutHandler}>
                    <ButtonIcon icon="box-arrow-in-right" />
                    <FormattedMessage
                        id="Common.SignOut"
                        defaultMessage="Signout"
                    />
                </Button>
            </FormFieldAction>
        </Section>
    );
};

export default SettingBotComponent;
