import React from "react";
import { FormattedMessage } from "react-intl";

// Component
import SettingSoundChattersComponent from "./SettingSoundChatters";
import SettingSoundChatsComponent from "./SettingSoundChats";
import SettingSoundRaidersComponent from "./SettingSoundRaiders";
import SettingSoundHostsComponent from "./SettingSoundHosts";

const SettingSoundComponent: React.FC = () => {
    return (
        <section className="section">
            <h2 className="section__header">
                <FormattedMessage
                    id="Component.SettingSound.Header"
                    defaultMessage="Notification Sound"
                />
            </h2>

            <SettingSoundChattersComponent />
            <SettingSoundChatsComponent />
            <SettingSoundRaidersComponent />
            <SettingSoundHostsComponent />
        </section>
    );
};

export default SettingSoundComponent;
