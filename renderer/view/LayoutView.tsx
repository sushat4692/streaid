import React from "react";

import SettingComponent from "../component/SettingComponent";
import ConnectComponent from "../component/ConnectComponent";

const Layout: React.FC = () => {
    return (
        <>
            <header className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
                <a
                    href="#"
                    className="navbar-brand col-md-3 col-lg-2 me-0 px-3"
                >
                    Twitch Support Tool
                </a>
            </header>

            <div className="container-fluid">
                <main>
                    <SettingComponent />
                    <ConnectComponent />
                </main>
            </div>
        </>
    );
};

export default Layout;
