import React, { useEffect, useState } from "react";

import IsConnectedStore from "../store/IsConnected";
import IsConnectingStore from "../store/IsConnecting";

// Util
import { request } from "../util/request";

const ConnectComonent: React.FC = () => {
    const [isConnected, updateIsConnected] = useState(
        IsConnectedStore.getState()
    );

    useEffect(() => {
        IsConnectedStore.subscribe(() => {
            updateIsConnected(IsConnectedStore.getState());
            IsConnectingStore.dispatch({ type: "DISABLE" });
        });
    }, []);

    const clickHandler = async () => {
        IsConnectingStore.dispatch({ type: "ENABLE" });

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
                {isConnected ? "Disconnect" : "Connect"}
            </button>
        </div>
    );
};

export default ConnectComonent;
