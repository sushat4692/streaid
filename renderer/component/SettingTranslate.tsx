import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

// Recoil
import IsConnectingState from "../atom/IsConnecting";

// Components
import CopyableFieldComponent from "./CopyableField";

// Utils
import { request } from "../util/request";

const SettingTranslateComponent: React.FC = () => {
    const intl = useIntl();

    const [isInited, updateIsInited] = useState(false);
    const [apiKey, updateApiKey] = useState("");
    const [defaultPlan, updateDefaultPlan] =
        useState<{ value: "free" | "pro"; label: string }>(null);
    const [webhookUrl, updateWebhookUrl] = useState("");
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

    const webhookUrlInputChangeHandler = useCallback(
        async (webhook: string) => {
            await request("translate:discord:webhook", webhook, "key");
            updateWebhookUrl(webhook);
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

            const { webhook } = await request(
                "translate:discord",
                {},
                { webhook: "url" }
            );
            updateWebhookUrl(webhook);

            updateIsInited(true);
        })();
    }, []);

    return (
        <>
            <section className="section">
                <h2 className="section__header">
                    <FormattedMessage
                        id="Component.SettingTranslate.DeepL.Header"
                        defaultMessage="DeepL Translate"
                    />
                </h2>

                <div className="alert">
                    <FormattedMessage
                        id="Component.SettingTranslate.DeepL.Descript"
                        defaultMessage="You can use Translation command after copy&paste the DeepL API Key (required signup to DeepL)"
                    />
                </div>

                <div className="row is-col-2">
                    <div className="form-field">
                        <label className="form-field__label">
                            <FormattedMessage
                                id="Common.Label.ApiKey"
                                defaultMessage="API Key"
                            />
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            value={apiKey}
                            onChange={(e) =>
                                apiKeyInputChangeHandler(e.target.value)
                            }
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-field__label">
                            <FormattedMessage
                                id="Common.Label.Plan"
                                defaultMessage="Plan"
                            />
                        </label>
                        {isInited ? (
                            <Select
                                name="language"
                                id="language"
                                classNamePrefix="react-select"
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
                    </div>
                </div>

                <div className="form-field">
                    <label className="form-field__label">
                        <FormattedMessage
                            id="Common.Label.Command"
                            defaultMessage="Command"
                        />
                    </label>

                    <CopyableFieldComponent text='!ts "{sentence}"' />
                </div>
            </section>

            <section className="section">
                <h2 className="section__header">
                    <FormattedMessage
                        id="Component.SettingTranslate.Dictionary.Header"
                        defaultMessage="JP to EN Dictionary"
                    />
                </h2>

                <div className="alert">
                    <FormattedMessage
                        id="Component.SettingTranslate.Dictionary.Descript"
                        defaultMessage="You can get the meaning of word from English to Japanese through the following command"
                    />
                </div>

                <div className="form-field">
                    <label className="form-field__label">
                        Discord Webhook URL <small>(Not required)</small>
                    </label>

                    <input
                        type="text"
                        className="form-control"
                        value={webhookUrl}
                        onChange={(e) =>
                            webhookUrlInputChangeHandler(e.target.value)
                        }
                    />

                    <small className="form-field__help">
                        <FormattedMessage
                            id="Component.SettingTranslate.Dictionary.Webhook.Help"
                            defaultMessage="* Automatically post your consulted word and the meaning to specific Discord channel"
                        />
                    </small>
                </div>

                <div className="form-field">
                    <label className="form-field__label">
                        <FormattedMessage
                            id="Common.Label.Command"
                            defaultMessage="Command"
                        />
                    </label>

                    <CopyableFieldComponent text="!w {word}" />
                </div>
            </section>
        </>
    );
};

export default SettingTranslateComponent;
