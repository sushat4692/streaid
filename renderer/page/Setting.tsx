import React from "react";
import { FormattedMessage } from "react-intl";

// Component
import MetaComponent from "../component/Meta";
import SettingLocaleComponent from "../component/SettingLocale";
import SettingBotComponent from "../component/SettingBot";
import SettingShoutOutMessageComponent from "../component/SettingShoutOutMessage";
import SettingSoundComponent from "../component/SettingSound";

const SettnigPage: React.FC = () => {
    return (
        <>
            <MetaComponent
                id="Common.Settings.Name"
                defaultMessage="Settings"
            />

            <h2 className="display-6 mt-4 mb-3 fw-bolder">
                <i className="bi bi-gear me-2" />
                <FormattedMessage
                    id="Common.Settings.Name"
                    defaultMessage="Settings"
                />
            </h2>

            <SettingLocaleComponent />
            <SettingBotComponent />
            <SettingShoutOutMessageComponent />
            <SettingSoundComponent />
        </>
    );
};

export default SettnigPage;
