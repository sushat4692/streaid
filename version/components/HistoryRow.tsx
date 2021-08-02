import React, { useEffect, useState } from "react";

// Type
import { VersionHistory } from "../../types/VersionHistory";

// Style
import styles from "./HistoryRow.module.css";

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
        <section className={styles.section}>
            <h2 className={styles.section__head}>v{history.version}</h2>
            <ul className={styles.list}>
                {messages.map((message, i) => {
                    return (
                        <li key={i} className={styles.list__item}>
                            {message}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default HistoryRowComponent;
