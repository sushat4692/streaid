import React from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

// Recoil
import LocaleState from "../atom/Locale";
import IsConnectingState from "../atom/IsConnecting";

// Utils
import { request } from "../util/request";

// Const
import { list as localeList } from "../const/locales";

const SettingBotComponent: React.FC = () => {
    const intl = useIntl();
    const [locale, updateLocate] = useRecoilState(LocaleState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);
    const defaultLocale = localeList.find((e) => e.value === locale);

    const onChangeHandler = async (e: { label: string; value: string }) => {
        updateIsConnecting(true);

        updateLocate(e.value);
        await request<string, null>("setting:locale:update", e.value, null);

        updateIsConnecting(false);
    };

    return (
        <section className="my-4">
            <h3>
                <FormattedMessage
                    id="Component.SettingLocale.Header"
                    defaultMessage="Language"
                />
            </h3>

            <Select
                name="language"
                id="language"
                classNamePrefix="react-select"
                defaultValue={defaultLocale}
                options={localeList}
                onChange={onChangeHandler}
                placeholder={intl.formatMessage({
                    id: "Common.Select.Placeholder",
                    defaultMessage: "Select...",
                })}
            />
        </section>
    );
};

export default SettingBotComponent;
