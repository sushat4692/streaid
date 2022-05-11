import React, { useCallback, useRef } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

// Recoil
import LocaleState from "../atom/Locale";
import IsConnectingState from "../atom/IsConnecting";

// Types
import { DefaultSelectType } from "../../types/DefaultSelect";

// Const
import { selectStyles } from "../const/selectStyles";
const languageStyle = selectStyles<DefaultSelectType, false>();

// Utils
import { request } from "../util/request";

// Const
import { list as localeList } from "../const/locales";

// Components
import Section from "../../component/Section";
import SectionHeader from "../../component/SectionHeader";

const SettingBotComponent: React.FC = () => {
    const intl = useIntl();
    const [locale, updateLocate] = useRecoilState(LocaleState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);
    const defaultLocale = useRef(localeList.find((e) => e.value === locale));

    const onChangeHandler = useCallback(
        async (e: { label: string; value: string }) => {
            updateIsConnecting(true);

            updateLocate(e.value);
            await request("setting:locale:update", e.value, null);

            updateIsConnecting(false);
        },
        []
    );

    return (
        <Section>
            <SectionHeader>
                <FormattedMessage
                    id="Component.SettingLocale.Header"
                    defaultMessage="Language"
                />
            </SectionHeader>

            <Select
                name="language"
                id="language"
                styles={languageStyle}
                defaultValue={defaultLocale.current}
                options={localeList}
                onChange={onChangeHandler}
                placeholder={intl.formatMessage({
                    id: "Common.Select.Placeholder",
                    defaultMessage: "Select...",
                })}
            />
        </Section>
    );
};

export default SettingBotComponent;
