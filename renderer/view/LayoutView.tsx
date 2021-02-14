import React, { useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

// Type
import { ResponseSettingType } from "../../types/SettingType";

// Component
import SettingPage from "../page/SettingPage";
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
                    <a className="navbar-brand" href="#">
                        Twitch Support Tool
                    </a>
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
                        </div>
                        <ConnectComponent />
                    </div>
                </div>
            </header>

            <div className="container-fluid">
                <main>
                    <Switch>
                        <Route path="/">
                            <SettingPage />
                        </Route>
                    </Switch>
                </main>
            </div>
        </Router>
    );
};

export default Layout;
