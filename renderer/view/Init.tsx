import React from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

// Recoil
import LocaleState from "../atom/Locale";
import IsInitedState from "../atom/IsInited";

// Utils
import { request } from "../util/request";

// Const
import { list as localeList } from "../const/locales";

const InitComponent: React.FC = () => {
    const intl = useIntl();
    const [locale, updateLocate] = useRecoilState(LocaleState);
    const updateIsInited = useSetRecoilState(IsInitedState);
    const defaultLocale = localeList.find((e) => e.value === locale);

    const updateLocaleHandler = async (e: { label: string; value: string }) => {
        updateLocate(e.value);
        await request<string, null>("setting:locale:update", e.value, null);
    };

    const clickHandler = async () => {
        await request("settings:get", null, null);
        updateIsInited(true);
    };

    return (
        <div className="container-fluid">
            <section className="d-flex justify-content-center align-items-center py-4 min-vh-100">
                <div>
                    <h2 className="display-4 mb-4 py-4 text-center fw-bolder">
                        <i className="bi bi-twitch me-2"></i>
                        <FormattedMessage
                            id="Common.Title"
                            defaultMessage="Twitch Support Tool"
                        />
                    </h2>

                    <div
                        style={{
                            width: "100%",
                            maxWidth: "330px",
                            margin: "auto",
                        }}
                    >
                        <h2 className="h3 mb-3 text-center">
                            <FormattedMessage
                                id="View.Init.Header"
                                defaultMessage="Signin to Twitch"
                            />
                        </h2>

                        <div className="mb-3">
                            <Select
                                name="language"
                                id="language"
                                defaultValue={defaultLocale}
                                options={localeList}
                                onChange={updateLocaleHandler}
                                placeholder={intl.formatMessage({
                                    id: "Common.Select.Placeholder",
                                    defaultMessage: "Select...",
                                })}
                            ></Select>
                        </div>

                        <button
                            className="w-100 btn btn-lg btn-primary"
                            onClick={clickHandler}
                        >
                            <FormattedMessage
                                id="Common.SignIn"
                                defaultMessage="Signin"
                            />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default InitComponent;
