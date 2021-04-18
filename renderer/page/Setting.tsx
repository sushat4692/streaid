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

            <div className="page-header">
                <div className="container-fluid">
                    <h1 className="page-header__text">
                        <i className="bi bi-gear page-header__icon" />
                        <FormattedMessage
                            id="Common.Settings.Name"
                            defaultMessage="Settings"
                        />
                    </h1>
                </div>
            </div>

            <div className="container-fluid">
                <SettingLocaleComponent />
                <SettingBotComponent />
                <SettingShoutOutMessageComponent />
                <SettingSoundComponent />
            </div>
        </>
    );
};

export default SettnigPage;
