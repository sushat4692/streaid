import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";

// Component
import MetaComponent from "../component/Meta";

// Styles
import styles from "./Dashboard.module.css";

export const NeedSettingPage: React.FC = () => {
    return (
        <>
            <MetaComponent />

            <h1 className={styles.header}>
                <i className={`bi bi-twitch ${styles.header__icon}`} />
                <FormattedMessage
                    id="Common.Title"
                    defaultMessage="Twitch Support Tool"
                />
            </h1>

            <div className="container-fluid">
                <section className="section">
                    <div className={styles.need}>
                        <p className={styles.need__lead}>
                            <FormattedMessage
                                id="Page.NeedSetting.Lead"
                                defaultMessage="Please update application setting first."
                            />
                        </p>

                        <Link
                            className="btn is-large is-primary"
                            to="/settings"
                        >
                            Settings
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
};

export default NeedSettingPage;
