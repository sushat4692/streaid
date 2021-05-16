import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import InputRange from "react-input-range";

// Components
import CopyableFieldComponent from "./CopyableField";

// Recoil
import ShoutoutAlertInfoLength from "../atom/ShoutoutAlertInfoLength";

// Util
import { request } from "../util/request";

// Styles
import styles from "./SettingShoutoutAlert.module.css";

const SettingShoutoutAlertInfo: React.FC = () => {
    const [infoLength, updateInfoLength] = useRecoilState(
        ShoutoutAlertInfoLength
    );
    const intl = useIntl();

    return (
        <>
            <h3 className="section__sub-header">
                <FormattedMessage
                    id="Component.SettingShoutOutAlert.Info.Header"
                    defaultMessage="Info"
                />

                <small className="section__sub-header__small">
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.Info.Descript"
                        defaultMessage="Showing alert the streamer information"
                    />
                </small>
            </h3>

            <div className="form-field">
                <label className="form-field__label">
                    <FormattedMessage
                        id="Common.Label.Command"
                        defaultMessage="Command"
                    />
                </label>

                <CopyableFieldComponent text="!so {user_id} info" />
            </div>

            <label className="form-field__label">
                <FormattedMessage
                    id="Common.Label.DisplayLength"
                    defaultMessage="Display Time Length"
                />
            </label>

            <div className={styles.field}>
                <InputRange
                    maxValue={60}
                    minValue={0}
                    value={infoLength}
                    formatLabel={(value) =>
                        `${value}${intl.formatMessage({
                            id: "Common.Unit.Second",
                            defaultMessage: "s",
                        })}`
                    }
                    onChange={async (value) => {
                        updateInfoLength(value as number);

                        await request(
                            "setting:shoutout:alert:length",
                            {
                                mode: "info",
                                value: value as number,
                            },
                            null
                        );
                    }}
                ></InputRange>
            </div>
        </>
    );
};

export default SettingShoutoutAlertInfo;
