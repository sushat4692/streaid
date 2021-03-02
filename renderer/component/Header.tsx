import React, { useEffect } from "react";
import { NavLink, useHistory } from "react-router-dom";
import { FormattedMessage } from "react-intl";

// Component
import ConnectComponent from "./Connect";

// Utils
import { requestEvent } from "../util/request";
import { useSettingState } from "../util/setting";

const HeaderComponent: React.FC = () => {
    const setting = useSettingState();
    const history = useHistory();

    useEffect(() => {
        requestEvent<string>("linkto", (_, values) => {
            history.push(values);
        });
    }, []);

    return (
        <header className="navbar navbar-expand-md navbar-dark sticky-top bg-dark shadow">
            <div className="container-fluid">
                <NavLink className="navbar-brand" to="/">
                    <i className="bi bi-twitch me-2"></i>
                    <FormattedMessage
                        id="Common.Title"
                        defaultMessage="Twitch Support Tool"
                    />
                </NavLink>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNavAltMarkup"
                    aria-controls="navbarNavAltMarkup"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div
                    className="collapse navbar-collapse"
                    id="navbarNavAltMarkup"
                >
                    <div className="navbar-nav me-auto mb-2 mb-md-0">
                        <NavLink
                            className={
                                setting.isEnableBot
                                    ? "nav-link"
                                    : "nav-link disabled"
                            }
                            activeClassName="active"
                            to="/chatters"
                        >
                            <FormattedMessage
                                id="Common.Chatters.Name"
                                defaultMessage="Chatters"
                            />
                        </NavLink>
                        <NavLink
                            className={
                                setting.isEnableBot
                                    ? "nav-link"
                                    : "nav-link disabled"
                            }
                            activeClassName="active"
                            to="/raiders"
                        >
                            <FormattedMessage
                                id="Common.Raiders.Name"
                                defaultMessage="Raiders"
                            />
                        </NavLink>
                        <NavLink
                            className={
                                setting.isEnableBot
                                    ? "nav-link"
                                    : "nav-link disabled"
                            }
                            activeClassName="active"
                            to="/hosts"
                        >
                            <FormattedMessage
                                id="Common.Hosts.Name"
                                defaultMessage="Hosts"
                            />
                        </NavLink>
                        <NavLink
                            className={
                                setting.isEnableChannel
                                    ? "nav-link"
                                    : "nav-link disabled"
                            }
                            activeClassName="active"
                            to="/channel"
                        >
                            <FormattedMessage
                                id="Common.Channel.Name"
                                defaultMessage="Channel"
                            />
                        </NavLink>
                    </div>
                    <div className="navbar-nav mb-2 mb-md-0 me-0 me-md-2">
                        <NavLink
                            className="nav-link"
                            activeClassName="active"
                            to="/settings"
                        >
                            <FormattedMessage
                                id="Common.Settings.Name"
                                defaultMessage="Settings"
                            />
                        </NavLink>
                    </div>
                    <ConnectComponent />
                </div>
            </div>
        </header>
    );
};

export default HeaderComponent;
