import React from "react";
import { FormattedMessage } from "react-intl";

// Components
import CopyableFieldComponent from "./CopyableField";

// Styles
import styles from "./SettingShoutoutAlert.module.css";

const SettingShoutoutAlertClip: React.FC = () => {
    return (
        <>
            <h3 className={styles.header}>
                <FormattedMessage
                    id="Component.SettingShoutOutAlert.Clip.Header"
                    defaultMessage="Clip"
                />

                <small className={styles.header__small}>
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.Clip.Descript"
                        defaultMessage="Showing alert the streamer's clip movie"
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

                <CopyableFieldComponent text="!so {user_id} clip" />
            </div>

            <div className="form-field">
                <label className="form-field__label">
                    <FormattedMessage
                        id="Common.Label.StopCommand"
                        defaultMessage="Stop Command"
                    />
                </label>

                <CopyableFieldComponent text="!stop" />

                <p className="form-field__help">
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.Clip.StopHelp"
                        defaultMessage="You can use this command when you want to stop the clip movie"
                    ></FormattedMessage>
                </p>
            </div>
        </>
    );
};

export default SettingShoutoutAlertClip;
