import React from "react";
import { FormattedMessage } from "react-intl";

// Components
import SettingShoutoutAlertInfoComponent from "./SettingShoutoutAlertInfo";
import SettingShoutoutAlertClipComponent from "./SettingShoutoutAlertClip";
import CopyableFieldComponent from "./CopyableField";

const SettingShoutoutAlert: React.FC = () => {
    return (
        <>
            <section className="section">
                <h2 className="section__header">
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.URL.Header"
                        defaultMessage="Shoutout Alert"
                    />
                </h2>

                <div className="alert">
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.URL.Descript"
                        defaultMessage='Please copy & Pase the following URL and embed "Browser" to your streaming tool (e.g. OBS)'
                    />
                </div>

                <CopyableFieldComponent
                    text="http://localhost:9990/"
                    isLarge
                ></CopyableFieldComponent>
            </section>

            <section className="section">
                <SettingShoutoutAlertInfoComponent></SettingShoutoutAlertInfoComponent>
                <SettingShoutoutAlertClipComponent></SettingShoutoutAlertClipComponent>
            </section>
        </>
    );
};

export default SettingShoutoutAlert;
