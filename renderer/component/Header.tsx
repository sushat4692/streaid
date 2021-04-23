import React, { useEffect, useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { FormattedMessage } from "react-intl";
// import { Collapse } from "bootstrap";

// Component
import ConnectComponent from "./Connect";

// Utils
import { requestEvent } from "../util/request";
import { useSettingState } from "../util/setting";

// Styles
import styles from "./Header.module.css";

const HeaderComponent: React.FC = () => {
    const [isSPNavView, updateIsSPNavView] = useState(false);
    const setting = useSettingState();
    const history = useHistory();

    useEffect(() => {
        requestEvent<string>("linkto", (_, values) => {
            history.push(values);
        });
    }, []);

    return (
        <header className={styles.nav}>
            <div className="container-fluid">
                <div className={styles.nav__inner}>
                    <div className={styles.nav__list}>
                        <NavLink className={styles.nav__list__brand} to="/">
                            <i className="bi bi-twitch" />
                        </NavLink>

                        <div className={styles.nav__list__menu}>
                            <div className={styles.nav__list__menu__inner}>
                                <NavLink
                                    className={styles.nav__list__menu__button}
                                    data-disable={!setting.isEnableBot}
                                    activeClassName={styles["is-active"]}
                                    to="/chatters"
                                >
                                    <FormattedMessage
                                        id="Common.Chatters.Name"
                                        defaultMessage="Chatters"
                                    />
                                </NavLink>
                                <NavLink
                                    className={styles.nav__list__menu__button}
                                    data-disable={!setting.isEnableBot}
                                    activeClassName={styles["is-active"]}
                                    to="/raiders"
                                >
                                    <FormattedMessage
                                        id="Common.Raiders.Name"
                                        defaultMessage="Raiders"
                                    />
                                </NavLink>
                                <NavLink
                                    className={styles.nav__list__menu__button}
                                    data-disable={!setting.isEnableBot}
                                    activeClassName={styles["is-active"]}
                                    to="/hosts"
                                >
                                    <FormattedMessage
                                        id="Common.Hosts.Name"
                                        defaultMessage="Hosts"
                                    />
                                </NavLink>
                                <NavLink
                                    className={styles.nav__list__menu__button}
                                    data-disable={!setting.isEnableChannel}
                                    activeClassName={styles["is-active"]}
                                    to="/channel"
                                >
                                    <FormattedMessage
                                        id="Common.Channel.Name"
                                        defaultMessage="Channel"
                                    />
                                </NavLink>
                                <NavLink
                                    className={styles.nav__list__menu__button}
                                    data-disable={!setting.isEnableBot}
                                    activeClassName={styles["is-active"]}
                                    to="/user_memo"
                                >
                                    <FormattedMessage
                                        id="Common.UserMemo.Name"
                                        defaultMessage="User memo"
                                    />
                                </NavLink>
                            </div>
                        </div>
                    </div>

                    <div className={styles.nav__side}>
                        <div className={styles.nav__side__inner}>
                            <NavLink
                                className={`${styles.nav__list__menu__button} ${styles.nav__side__inner__button}`}
                                activeClassName={styles["is-active"]}
                                to="/settings"
                            >
                                <FormattedMessage
                                    id="Common.Settings.Name"
                                    defaultMessage="Settings"
                                />
                            </NavLink>

                            <ConnectComponent />
                        </div>
                    </div>

                    <div className={styles.nav__burger}>
                        <button
                            type="button"
                            className={styles.nav__burger__button}
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                            onClick={() => {
                                updateIsSPNavView(!isSPNavView);
                            }}
                        >
                            <span className={styles.nav__burger__button__label}>
                                Open main menu
                            </span>

                            <svg
                                className={styles.nav__burger__button__icon}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                                data-visible={!isSPNavView}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>

                            <svg
                                className={styles.nav__burger__button__icon}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                                data-visible={isSPNavView}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.nav__mobile} data-visible={isSPNavView}>
                <div className={styles.nav__mobile__menu}>
                    <NavLink
                        className={styles.nav__mobile__menu__button}
                        data-disable={!setting.isEnableBot}
                        activeClassName="active"
                        to="/chatters"
                    >
                        <FormattedMessage
                            id="Common.Chatters.Name"
                            defaultMessage="Chatters"
                        />
                    </NavLink>
                    <NavLink
                        className={styles.nav__mobile__menu__button}
                        data-disable={!setting.isEnableBot}
                        activeClassName="active"
                        to="/raiders"
                    >
                        <FormattedMessage
                            id="Common.Raiders.Name"
                            defaultMessage="Raiders"
                        />
                    </NavLink>
                    <NavLink
                        className={styles.nav__mobile__menu__button}
                        data-disable={!setting.isEnableBot}
                        activeClassName="active"
                        to="/hosts"
                    >
                        <FormattedMessage
                            id="Common.Hosts.Name"
                            defaultMessage="Hosts"
                        />
                    </NavLink>
                    <NavLink
                        className={styles.nav__mobile__menu__button}
                        data-disable={!setting.isEnableChannel}
                        activeClassName="active"
                        to="/channel"
                    >
                        <FormattedMessage
                            id="Common.Channel.Name"
                            defaultMessage="Channel"
                        />
                    </NavLink>
                    <NavLink
                        className={styles.nav__mobile__menu__button}
                        data-disable={!setting.isEnableBot}
                        activeClassName="active"
                        to="/user_memo"
                    >
                        <FormattedMessage
                            id="Common.UserMemo.Name"
                            defaultMessage="User memo"
                        />
                    </NavLink>
                    <ConnectComponent isBlock={true} />
                </div>
            </div>
        </header>
    );
};

export default HeaderComponent;
