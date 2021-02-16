import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

// Type
import { ResponseSettingType } from "../../types/SettingType";

// Component
import DashboardPage from "../page/DashboardPage";
import SettingPage from "../page/SettingPage";
import ChattersPage from "../page/ChattersPage";
import ConnectComponent from "../component/ConnectComponent";

// Store
import UsernameStore from "../store/Username";
import ChannelsStore from "../store/Channels";
import IsConnectingStore from "../store/IsConnecting";

// Utils
import { request } from "../util/request";

const Layout: React.FC = () => {
    useEffect(() => {
        (async () => {
            IsConnectingStore.dispatch({ type: "ENABLE" });

            const defaultValue = await request<any, ResponseSettingType>(
                "get:settings",
                null,
                { username: "", channels: [] }
            );

            UsernameStore.dispatch({
                type: "UPDATE",
                state: defaultValue.username,
            });
            ChannelsStore.dispatch({
                type: "UPDATE",
                state: defaultValue.channels.join(","),
            });

            IsConnectingStore.dispatch({ type: "DISABLE" });
        })();
    });

    return (
        <Router>
            <header className="navbar navbar-expand-md navbar-dark sticky-top bg-dark shadow">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/">
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
                        <div className="navbar-nav me-auto mb-2 mb-lg-0">
                            <Link
                                className="nav-link"
                                aria-current="page"
                                to="/"
                            >
                                Home
                            </Link>
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
