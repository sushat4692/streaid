import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

// Type
import { ResponseSettingType } from "../../types/SettingType";

// Component
import DashboardPage from "../page/Dashboard";
import ChattersPage from "../page/Chatters";
import RaidersPage from "../page/Raiders";
import HostsPage from "../page/Hosts";
import ChannelPage from "../page/Channel";
import SettingPage from "../page/Setting";
import ConnectComponent from "../component/Connect";

// Store
import { updateAction as updateSettingUsername } from "../store/SettingUsername";
import { updateAction as updateSettingChannel } from "../store/SettingChannel";
import { updateAction as updateShoutOutMessage } from "../store/SettingShoutOutMessage";
import { updateAction as updateShoutOutNotFound } from "../store/SettingShoutOutNotFound";
import { updateAction as updateShoutOutFailed } from "../store/SettingShoutOutFailed";
import { updateAction as updateChatterVolume } from "../store/SoundChatterVolume";
import { updateAction as updateRaidVolume } from "../store/SoundRaidVolume";
import { updateAction as updateHostVolume } from "../store/SoundHostVolume";
import { enableAction, disableAction } from "../store/IsConnecting";

// Utils
import { request } from "../util/request";

const Layout: React.FC = () => {
    useEffect(() => {
        (async () => {
            enableAction();

            const defaultValue = await request<null, ResponseSettingType>(
                "settings:get",
                null,
                {
                    username: "",
                    channel: "",
                    shoutout_message: "",
                    shoutout_not_found: "",
                    shoutout_failed: "",
                    chatter_volume: 1,
                    raid_volume: 1,
                    host_volume: 1,
                }
            );

            updateSettingUsername(defaultValue.username);
            updateSettingChannel(defaultValue.channel);
            updateShoutOutMessage(defaultValue.shoutout_message);
            updateShoutOutNotFound(defaultValue.shoutout_not_found);
            updateShoutOutFailed(defaultValue.shoutout_failed);
            updateChatterVolume(defaultValue.chatter_volume);
            updateRaidVolume(defaultValue.raid_volume);
            updateHostVolume(defaultValue.host_volume);

            disableAction();
        })();
    }, []);

    return (
        <Router>
            <header className="navbar navbar-expand-md navbar-dark sticky-top bg-dark shadow">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/">
                        <i className="bi bi-twitch me-2"></i>
                        Twitch Support Tool
                    </Link>
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
                            <Link
                                className="nav-link"
                                aria-current="page"
                                to="/chatters"
                            >
                                Chatters
                            </Link>
                            <Link
                                className="nav-link"
                                aria-current="page"
                                to="/raiders"
                            >
                                Raiders
                            </Link>
                            <Link
                                className="nav-link"
                                aria-current="page"
                                to="/hosts"
                            >
                                Hosts
                            </Link>
                            <Link
                                className="nav-link"
                                aria-current="page"
                                to="/channel"
                            >
                                Channel
                            </Link>
                        </div>
                        <div className="navbar-nav mb-2 mb-md-0 me-0 me-md-2">
                            <Link
                                className="nav-link"
                                aria-current="page"
                                to="/settings"
                            >
                                Settings
                            </Link>
                        </div>
                        <ConnectComponent />
                    </div>
                </div>
            </header>

            <div className="container-fluid">
                <main>
                    <Switch>
                        <Route path="/chatters">
                            <ChattersPage />
                        </Route>
                        <Route path="/raiders">
                            <RaidersPage />
                        </Route>
                        <Route path="/hosts">
                            <HostsPage />
                        </Route>
                        <Route path="/channel">
                            <ChannelPage />
                        </Route>
                        <Route path="/settings">
                            <SettingPage />
                        </Route>
                        <Route path="/">
                            <DashboardPage />
                        </Route>
                    </Switch>
                </main>
            </div>
        </Router>
    );
};

export default Layout;
