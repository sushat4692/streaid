import React from "react";
import { FormattedMessage } from "react-intl";

// Component
import SettingSoundChatters from "./SettingSoundChatters";
import SettingSoundChats from "./SettingSoundChats";
import SettingSoundRaiders from "./SettingSoundRaiders";
import SettingSoundHosts from "./SettingSoundHosts";
import Section from "../../component/Section";
import SectionHeader from "../../component/SectionHeader";

const SettingSoundComponent: React.FC = () => {
    return (
        <Section>
            <SectionHeader>
                <FormattedMessage
                    id="Component.SettingSound.Header"
                    defaultMessage="Notification Sound"
                />
            </SectionHeader>

            <SettingSoundChatters />
            <SettingSoundChats />
            <SettingSoundRaiders />
            <SettingSoundHosts />
        </Section>
    );
};

export default SettingSoundComponent;
