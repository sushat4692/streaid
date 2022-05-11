import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";

// Components
import CopyableFieldComponent from "./CopyableField";
import SectionBox from "../../component/SectionBox";
import SectionSubHeader from "../../component/SectionSubHeader";
import SectionSubHeaderSmall from "../../component/SectionSubHeaderSmall";
import FormField from "./FormField";
import FormFieldLabel from "./FormFieldLabel";
import FormInputRange from "./FormInputRange";

// Recoil
import ShoutoutAlertInfoLength from "../atom/ShoutoutAlertInfoLength";

// Util
import { request } from "../util/request";

const SettingShoutoutAlertInfo: React.FC = () => {
    const [infoLength, updateInfoLength] = useRecoilState(
        ShoutoutAlertInfoLength
    );
    const intl = useIntl();

    return (
        <>
            <SectionSubHeader>
                <FormattedMessage
                    id="Component.SettingShoutOutAlert.Info.Header"
                    defaultMessage="Info"
                />

                <SectionSubHeaderSmall>
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.Info.Descript"
                        defaultMessage="Showing alert the streamer information"
                    />
                </SectionSubHeaderSmall>
            </SectionSubHeader>

            <FormField>
                <FormFieldLabel>
                    <FormattedMessage
                        id="Common.Label.Command"
                        defaultMessage="Command"
                    />
                </FormFieldLabel>

                <CopyableFieldComponent text="!so {user_id} info" />
            </FormField>

            <FormField>
                <FormFieldLabel>
                    <FormattedMessage
                        id="Common.Label.DisplayLength"
                        defaultMessage="Display Time Length"
                    />
                </FormFieldLabel>

                <SectionBox>
                    <FormInputRange
                        min={0}
                        max={60}
                        value={infoLength}
                        formatLabel={(value) =>
                            `${value}${intl.formatMessage({
                                id: "Common.Unit.Second",
                                defaultMessage: "s",
                            })}`
                        }
                        onChange={async (value) => {
                            updateInfoLength(value);

                            await request(
                                "setting:shoutout:alert:length",
                                {
                                    mode: "info",
                                    value: value,
                                },
                                null
                            );
                        }}
                    />
                </SectionBox>
            </FormField>
        </>
    );
};

export default SettingShoutoutAlertInfo;
