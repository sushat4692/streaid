import React, { useEffect, useState } from "react";
import tw from "twin.macro";

// Type
import { VersionHistory } from "../../types/VersionHistory";

// Component
import Section from "../../component/Section";
import SectionHeader from "../../component/SectionHeader";
const List = tw.ul`ml-5`;
const ListItem = tw.li`list-disc`;

type Props = {
    history: VersionHistory;
    locale: string;
};

const HistoryRowComponent = ({ history, locale }: Props) => {
    const [messages, updateMessages] = useState<string[]>([]);

    useEffect(() => {
        switch (locale) {
            case "en-us":
            case "ja-jp":
                updateMessages(history[locale]);
                break;
            default:
                updateMessages([]);
                break;
        }
    }, [locale]);

    return (
        <Section>
            <SectionHeader>v{history.version}</SectionHeader>
            <List>
                {messages.map((message, i) => {
                    return <ListItem key={i}>{message}</ListItem>;
                })}
            </List>
        </Section>
    );
};

export default HistoryRowComponent;
