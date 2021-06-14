import React, { useState, useEffect } from "react";
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
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const options: { value: "free" | "pro"; label: string }[] = [
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
    ];

    const inputChangeHandler = async (apiKey: string) => {
        await request("translate:deepl:apikey", apiKey, "key");
        updateApiKey(apiKey);
    };

    const onSelectChangeHandler = async (e: {
        label: string;
        value: string;
    }) => {
        updateIsConnecting(true);

        await request("translate:deepl:plan", e.value as "free" | "pro", null);

        updateIsConnecting(false);
    };

    useEffect(() => {
        (async () => {
            const { apikey, plan } = await request(
                "translate:deepl",
                {},
                { apikey: "key", plan: "free" }
            );
            updateApiKey(apikey);
            updateDefaultPlan(options.find((option) => option.value === plan));

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
                            onChange={(e) => inputChangeHandler(e.target.value)}
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
                                options={options}
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
