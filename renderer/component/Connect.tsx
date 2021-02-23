import React, { useEffect, useState } from "react";

import {
    getState as getIsConnected,
    subscribe as subscribeIsConnected,
} from "../store/IsConnected";
import {
    enableAction as enableIsConnecting,
    disableAction as disableIsConnecting,
} from "../store/IsConnecting";

// Util
import { request } from "../util/request";

const ConnectComonent: React.FC = () => {
    const [isConnected, updateIsConnected] = useState(getIsConnected());

    useEffect(() => {
        subscribeIsConnected(() => {
            updateIsConnected(getIsConnected());
            disableIsConnecting();
        });
    }, []);

    const clickHandler = async () => {
        enableIsConnecting();

        if (isConnected) {
            await request("bot:disconnect", null, null);
        } else {
            await request("bot:connect", null, null);
        }
    };

    return (
        <div className="d-grid gap-2 d-md-block">
            <button
                className={isConnected ? "btn btn-danger" : "btn btn-primary"}
                onClick={clickHandler}
            >
                <i className="bi bi-link-45deg me-2"></i>
                {isConnected ? "Disconnect" : "Connect"}
            </button>
        </div>
    );
};

export default ConnectComonent;
