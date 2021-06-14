import React from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";

// Util
import { useSettingState } from "../util/setting";

// Component
import MetaComponent from "../component/Meta";

// Styles
import styles from "./Dashboard.module.css";

const DashboardPage: React.FC = () => {
    const setting = useSettingState();

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
                    <div className={styles.cards}>
                        <div className={styles.cards__item}>
                            <h2 className={styles.cards__head}>
                                <i
                                    className={`bi bi-chat ${styles.cards__head__icon}`}
                                />
                                <FormattedMessage
                                    id="Common.Chatters.Name"
                                    defaultMessage="Chatters"
                                />
                            </h2>
                            <p className={styles.cards__text}>
                                <FormattedMessage
                                    id="Common.Chatters.Description"
                                    defaultMessage="Display user list that comment to target channel."
                                />
                            </p>
                            <Link
                                to="/chatters"
                                className={`btn is-primary ${
                                    setting.isEnableBot
                                        ? "is-stretched"
                                        : "is-disabled"
                                }`}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </Link>
                        </div>

                        <div className={styles.cards__item}>
                            <h2 className={styles.cards__head}>
                                <i
                                    className={`bi bi-tornado ${styles.cards__head__icon}`}
                                />
                                <FormattedMessage
                                    id="Common.Raiders.Name"
                                    defaultMessage="Raiders"
                                />
                            </h2>
                            <p className={styles.cards__text}>
                                <FormattedMessage
                                    id="Common.Raiders.Description"
                                    defaultMessage="Display user list that raided to target channel."
                                />
                            </p>
                            <Link
                                to="/raiders"
                                className={`btn is-primary ${
                                    setting.isEnableBot
                                        ? "is-stretched"
                                        : "is-disabled"
                                }`}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </Link>
                        </div>

                        <div className={styles.cards__item}>
                            <h2 className={styles.cards__head}>
                                <i
                                    className={`bi bi-display ${styles.cards__head__icon}`}
                                />
                                <FormattedMessage
                                    id="Common.Hosts.Name"
                                    defaultMessage="Hosts"
                                />
                            </h2>
                            <p className={styles.cards__text}>
                                <FormattedMessage
                                    id="Common.Hosts.Description"
                                    defaultMessage="Display user list that hosted to target channel."
                                />
                            </p>
                            <Link
                                to="/hosts"
                                className={`btn is-primary ${
                                    setting.isEnableBot
                                        ? "is-stretched"
                                        : "is-disabled"
                                }`}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </Link>
                        </div>

                        <div className={styles.cards__item}>
                            <h2 className={styles.cards__head}>
                                <i
                                    className={`bi bi-camera-reels ${styles.cards__head__icon}`}
                                />
                                <FormattedMessage
                                    id="Common.Channel.Name"
                                    defaultMessage="Channel"
                                />
                            </h2>
                            <p className={styles.cards__text}>
                                <FormattedMessage
                                    id="Common.Channel.Description"
                                    defaultMessage="You can check/update Channel information."
                                />
                            </p>
                            <Link
                                to="/channel"
                                className={`btn is-primary ${
                                    setting.isEnableChannel
                                        ? "is-stretched"
                                        : "is-disabled"
                                }`}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </Link>
                        </div>

                        <div className={styles.cards__item}>
                            <h2 className={styles.cards__head}>
                                <i
                                    className={`bi bi-people ${styles.cards__head__icon}`}
                                />
                                <FormattedMessage
                                    id="Common.UserMemo.Name"
                                    defaultMessage="Channel"
                                />
                            </h2>
                            <p className={styles.cards__text}>
                                <FormattedMessage
                                    id="Common.UserMemo.Description"
                                    defaultMessage="You can store the target additional information."
                                />
                            </p>
                            <Link
                                to="/user_memo"
                                className={`btn is-primary ${
                                    setting.isEnableBot
                                        ? "is-stretched"
                                        : "is-disabled"
                                }`}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </Link>
                        </div>

                        <div className={styles.cards__item}>
                            <h2 className={styles.cards__head}>
                                <i
                                    className={`bi bi-wrench ${styles.cards__head__icon}`}
                                />
                                <FormattedMessage
                                    id="Common.Command.Name"
                                    defaultMessage="Command"
                                />
                            </h2>
                            <p className={styles.cards__text}>
                                <FormattedMessage
                                    id="Common.Command.Description"
                                    defaultMessage="You can manage your own channel command."
                                />
                            </p>
                            <Link
                                to="/commands"
                                className={`btn is-primary ${
                                    setting.isEnableBot
                                        ? "is-stretched"
                                        : "is-disabled"
                                }`}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default DashboardPage;
