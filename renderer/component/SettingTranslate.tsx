import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

// Type
import { DefaultSelectType } from "../../types/DefaultSelect";

// Const
import { selectStyles } from "../const/selectStyles";
const planStyle = selectStyles<DefaultSelectType, false>();

// Recoil
import IsConnectingState from "../atom/IsConnecting";

// Utils
import { request } from "../util/request";

// Components
import CopyableFieldComponent from "./CopyableField";
import Alert from "../../component/Alert";
import Row from "./Row";
import Section from "../../component/Section";
import SectionHeader from "../../component/SectionHeader";
import FormField from "./FormField";
import FormFieldLabel from "./FormFieldLabel";
import FormFieldHelp from "./FormFieldHelp";
import FormInputText from "./FormInputText";

const SettingTranslateComponent: React.FC = () => {
    const intl = useIntl();

    const [isInited, updateIsInited] = useState(false);
    const [apiKey, updateApiKey] = useState("");
    const [defaultPlan, updateDefaultPlan] =
        useState<{ value: "free" | "pro"; label: string }>(null);
    const [e2jWebhookUrl, updateE2jWebhookUrl] = useState("");
    const [j2eWebhookUrl, updateJ2eWebhookUrl] = useState("");
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const options = useRef<{ value: "free" | "pro"; label: string }[]>([
        {
            value: "free",
            label: intl.formatMessage({
                id: "Component.SettingTranslate.Free",
            }),
        },
        {
            value: "pro",
            label: intl.formatMessage({ id: "Component.SettingTranslate.Pro" }),
        },
    ]);

    const apiKeyInputChangeHandler = useCallback(async (apiKey: string) => {
        await request("translate:deepl:apikey", apiKey, "key");
        updateApiKey(apiKey);
    }, []);

    const onSelectChangeHandler = useCallback(
        async (e: { label: string; value: string }) => {
            updateIsConnecting(true);

            await request(
                "translate:deepl:plan",
                e.value as "free" | "pro",
                null
            );

            updateIsConnecting(false);
        },
        []
    );

    const e2jWebhookUrlInputChangeHandler = useCallback(
        async (webhook: string) => {
            await request("translate:e2j:discord:webhook", webhook, "key");
            updateE2jWebhookUrl(webhook);
        },
        []
    );
    const j2eWebhookUrlInputChangeHandler = useCallback(
        async (webhook: string) => {
            await request("translate:j2e:discord:webhook", webhook, "key");
            updateJ2eWebhookUrl(webhook);
        },
        []
    );

    useEffect(() => {
        (async () => {
            const { apikey, plan } = await request(
                "translate:deepl",
                {},
                { apikey: "key", plan: "free" }
            );
            updateApiKey(apikey);
            updateDefaultPlan(
                options.current.find((option) => option.value === plan)
            );

            const e2jResult = await request(
                "translate:e2j:discord",
                {},
                { webhook: "url" }
            );
            updateE2jWebhookUrl(e2jResult.webhook);

            const j2eResult = await request(
                "translate:j2e:discord",
                {},
                { webhook: "url" }
            );
            updateJ2eWebhookUrl(j2eResult.webhook);

            updateIsInited(true);
        })();
    }, []);

    return (
        <>
            <Section>
                <SectionHeader>
                    <FormattedMessage
                        id="Component.SettingTranslate.DeepL.Header"
                        defaultMessage="DeepL Translate"
                    />
                </SectionHeader>

                <Alert>
                    <FormattedMessage
                        id="Component.SettingTranslate.DeepL.Descript"
                        defaultMessage="You can use Translation command after copy&paste the DeepL API Key (required signup to DeepL)"
                    />
                </Alert>

                <Row col={2}>
                    <FormField>
                        <FormFieldLabel>
                            <FormattedMessage
                                id="Common.Label.ApiKey"
                                defaultMessage="API Key"
                            />
                        </FormFieldLabel>

                        <FormInputText
                            type="text"
                            value={apiKey}
                            onChange={(e) =>
                                apiKeyInputChangeHandler(e.target.value)
                            }
                        />
                    </FormField>
                    <FormField>
                        <FormFieldLabel>
                            <FormattedMessage
                                id="Common.Label.Plan"
                                defaultMessage="Plan"
                            />
                        </FormFieldLabel>
                        {isInited ? (
                            <Select
                                name="plan"
                                id="plan"
                                styles={planStyle}
                                defaultValue={defaultPlan}
                                options={options.current}
                                onChange={onSelectChangeHandler}
                                placeholder={intl.formatMessage({
                                    id: "Common.Select.Placeholder",
                                    defaultMessage: "Select...",
                                })}
                            ></Select>
                        ) : (
                            ""
                        )}
                    </FormField>
                </Row>

                <FormField>
                    <FormFieldLabel>
                        <FormattedMessage
                            id="Common.Label.Command"
                            defaultMessage="Command"
                        />
                    </FormFieldLabel>

                    <CopyableFieldComponent text='!ts "{sentence}"' />
                </FormField>
            </Section>

            <Section>
                <SectionHeader>
                    <FormattedMessage
                        id="Component.SettingTranslate.E2JDictionary.Header"
                        defaultMessage="EN to JP Dictionary"
                    />
                </SectionHeader>

                <Alert>
                    <FormattedMessage
                        id="Component.SettingTranslate.E2JDictionary.Descript"
                        defaultMessage="You can get the meaning of word from English to Japanese through the following command"
                    />
                </Alert>

                <FormField>
                    <FormFieldLabel>
                        Discord Webhook URL <small>(Not required)</small>
                    </FormFieldLabel>

                    <FormInputText
                        type="text"
                        value={e2jWebhookUrl}
                        onChange={(e) =>
                            e2jWebhookUrlInputChangeHandler(e.target.value)
                        }
                    />

                    <FormFieldHelp>
                        <FormattedMessage
                            id="Component.SettingTranslate.E2JDictionary.Webhook.Help"
                            defaultMessage="* Automatically post your consulted word and the meaning to specific Discord channel"
                        />
                    </FormFieldHelp>
                </FormField>

                <FormField>
                    <FormFieldLabel>
                        <FormattedMessage
                            id="Common.Label.Command"
                            defaultMessage="Command"
                        />
                    </FormFieldLabel>

                    <CopyableFieldComponent text="!e2j {word}" />
                </FormField>
            </Section>

            <Section>
                <SectionHeader>
                    <FormattedMessage
                        id="Component.SettingTranslate.J2EDictionary.Header"
                        defaultMessage="JP to EN Dictionary"
                    />
                </SectionHeader>

                <Alert>
                    <FormattedMessage
                        id="Component.SettingTranslate.J2EDictionary.Descript"
                        defaultMessage="You can get the meaning of word from English to Japanese through the following command"
                    />
                </Alert>

                <FormField>
                    <FormFieldLabel>
                        Discord Webhook URL <small>(Not required)</small>
                    </FormFieldLabel>

                    <FormInputText
                        type="text"
                        value={j2eWebhookUrl}
                        onChange={(e) =>
                            j2eWebhookUrlInputChangeHandler(e.target.value)
                        }
                    />

                    <FormFieldHelp>
                        <FormattedMessage
                            id="Component.SettingTranslate.J2EDictionary.Webhook.Help"
                            defaultMessage="* Automatically post your consulted word and the meaning to specific Discord channel"
                        />
                    </FormFieldHelp>
                </FormField>

                <FormField>
                    <FormFieldLabel>
                        <FormattedMessage
                            id="Common.Label.Command"
                            defaultMessage="Command"
                        />
                    </FormFieldLabel>

                    <CopyableFieldComponent text="!j2e {word}" />
                </FormField>
            </Section>
        </>
    );
};

export default SettingTranslateComponent;
