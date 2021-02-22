import React from "react";

// Component
import SettingBotComponent from "../component/SettingBotComponent";
import SettingShoutOutMessageComponent from "../component/SettingShoutOutMessageComponent";
import SettingSoundComponent from "../component/SettingSound";

const SettnigPage: React.FC = () => {
    return (
        <>
            <SettingBotComponent />
            <SettingShoutOutMessageComponent />
            <SettingSoundComponent />
        </>
    );
};

export default SettnigPage;
