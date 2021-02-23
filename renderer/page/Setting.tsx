import React from "react";

// Component
import SettingBotComponent from "../component/SettingBot";
import SettingShoutOutMessageComponent from "../component/SettingShoutOutMessage";
import SettingSoundComponent from "../component/SettingSound";

const SettnigPage: React.FC = () => {
    return (
        <>
            <h2 className="display-6 mt-4 mb-3 fw-bolder">
                <i className="bi bi-gear me-2"></i>
                Settings
            </h2>

            <SettingBotComponent />
            <SettingShoutOutMessageComponent />
            <SettingSoundComponent />
        </>
    );
};

export default SettnigPage;
