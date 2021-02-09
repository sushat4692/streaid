import React, { useEffect, useState } from "react";

// Context
import AppStore, { Action } from "./store/App";

// Layout
import LoadingComponent from "./component/LoadingComponent";
import InitView from "./view/InitView";
import LayoutView from "./view/LayoutView";

type SettingType = {
    username: string;
    password: string;
    channels: string[];
};

declare global {
    interface Window {
        getInit: () => Promise<boolean>;
        getSettings: () => Promise<SettingType>;
        saveSettings: (values: { channels: string[] }) => Promise<any>;
        signOut: () => Promise<any>;
        connectToTwicth: () => Promise<any>;
        disConnectToTwicth: () => Promise<any>;
        botConnected: () => void;
        botDisconnected: () => void;
    }
}
const App: React.FC = () => {
    const [isInited, updateIsInited] = useState(false);

    useEffect(() => {
        AppStore.subscribe(() => {
            updateIsInited(AppStore.getState().isInited);
        });

        (async () => {
            AppStore.dispatch({ type: Action.START_CONNECTING });

            const isInited = await window.getInit();
            AppStore.dispatch({
                type: Action.UPDATE,
                state: { isInited },
            });

            AppStore.dispatch({ type: Action.STOP_CONNECTING });
        })();
    }, []);

    return (
        <>
            {isInited ? <LayoutView /> : <InitView />}
            <LoadingComponent />
        </>
    );
};

export default App;
