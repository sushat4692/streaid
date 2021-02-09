import React, { useState } from "react";

import AppStore, { Action } from "../store/App";

const ConnectComonent: React.FC = () => {
    const [isConnected, updateIsConnected] = useState(false);

    window.botConnected = () => {
        AppStore.dispatch({
            type: Action.UPDATE,
            state: { isConnected: true },
        });
        updateIsConnected(true);

        AppStore.dispatch({ type: Action.STOP_CONNECTING });
    };
    window.botDisconnected = () => {
        AppStore.dispatch({
            type: Action.UPDATE,
            state: { isConnected: false },
        });
        updateIsConnected(false);

        AppStore.dispatch({ type: Action.STOP_CONNECTING });
    };

    const clickHandler = async () => {
        AppStore.dispatch({ type: Action.START_CONNECTING });

        if (isConnected) {
            await window.disConnectToTwicth();
        } else {
            await window.connectToTwicth();
        }
    };

    return (
        <section className="mt-4">
            <h2>Connect</h2>
            <button
                className={isConnected ? "btn btn-danger" : "btn btn-primary"}
                onClick={clickHandler}
            >
                {isConnected ? "Disconnect" : "Connect"}
            </button>
        </section>
    );
};

export default ConnectComonent;
