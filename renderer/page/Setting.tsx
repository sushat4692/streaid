import React from "react";
import { FormattedMessage } from "react-intl";
import { NavLink, Switch, Route } from "react-router-dom";

// Component
import MetaComponent from "../component/Meta";
import SettingLocaleComponent from "../component/SettingLocale";
import SettingBotComponent from "../component/SettingBot";
import SettingShoutOutMessageComponent from "../component/SettingShoutOutMessage";
import SettingShoutoutAlertComponent from "../component/SettingShoutoutAlert";
import SettingSoundComponent from "../component/SettingSound";
import SettingTranslateComponent from "../component/SettingTranslate";

import styles from "./Setting.module.css";

type Props = {
    match: {
        isExact: boolean;
        params: { [key: string]: unknown };
        path: string;
        url: string;
    };
};

const SettnigPage: React.FC<Props> = ({ match }: Props) => {
    if (!match) {
        return <></>;
    }

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

            <div className={styles.wrap}>
                <nav className={styles.nav}>
                    <NavLink
                        className={styles.nav__item}
                        activeClassName={styles["is-active"]}
                        exact
                        to={match.url}
                    >
                        <FormattedMessage
                            id="Component.Setting.General"
                            defaultMessage="General"
                        />
                    </NavLink>
                    <NavLink
                        className={styles.nav__item}
                        activeClassName={styles["is-active"]}
                        exact
                        to={`${match.url}/shoutout`}
                    >
                        <FormattedMessage
                            id="Component.SettingShoutOutMessage.Header"
                            defaultMessage="Shoutout Message"
                        />
                    </NavLink>
                    <NavLink
                        className={styles.nav__item}
                        activeClassName={styles["is-active"]}
                        exact
                        to={`${match.url}/shoutout_alert`}
                    >
                        <FormattedMessage
                            id="Component.SettingShoutOutAlert.Header"
                            defaultMessage="Shoutout Alert"
                        />
                    </NavLink>
                    <NavLink
                        className={styles.nav__item}
                        activeClassName={styles["is-active"]}
                        exact
                        to={`${match.url}/sound`}
                    >
                        <FormattedMessage
                            id="Component.SettingSound.Header"
                            defaultMessage="Notification Sound"
                        />
                    </NavLink>
                    <NavLink
                        className={styles.nav__item}
                        activeClassName={styles["is-active"]}
                        exact
                        to={`${match.url}/translate`}
                    >
                        <FormattedMessage
                            id="Component.SettingTranslate.Header"
                            defaultMessage="Translate"
                        />
                    </NavLink>
                </nav>

                <main className={styles.main}>
                    <div className="container-fluid">
                        <Switch>
                            <Route exact path={match.url}>
                                <SettingLocaleComponent></SettingLocaleComponent>
                                <SettingBotComponent></SettingBotComponent>
                            </Route>
                            <Route
                                exact
                                path={match.url + `/shoutout`}
                                component={SettingShoutOutMessageComponent}
                            ></Route>
                            <Route
                                exact
                                path={`${match.url}/shoutout_alert`}
                                component={SettingShoutoutAlertComponent}
                            ></Route>
                            <Route
                                exact
                                path={match.url + `/sound`}
                                component={SettingSoundComponent}
                            ></Route>
                            <Route
                                exact
                                path={match.url + `/translate`}
                                component={SettingTranslateComponent}
                            ></Route>
                        </Switch>
                    </div>
                </main>
            </div>
        </>
    );
};

export default SettnigPage;
