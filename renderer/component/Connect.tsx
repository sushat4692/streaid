import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

// Recoil
import IsConnectedState from "../atom/IsConnected";
import IsConnectingState from "../atom/IsConnecting";

// Util
import { request } from "../util/request";

const ConnectComonent: React.FC = () => {
    const isConnected = useRecoilValue(IsConnectedState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const clickHandler = async () => {
        updateIsConnecting(true);

        if (isConnected) {
            await request("bot:disconnect", null, null);
        } else {
            await request("bot:connect", null, null);
        }

        updateIsConnecting(false);
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
