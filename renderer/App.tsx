import React, { useEffect, useState } from "react";

// Context
import IsInitedStore from "./store/IsInited";
import IsConnectedStore from "./store/IsConnected";
import IsConnectingStore from "./store/IsConnecting";

// Layout
import LoadingComponent from "./component/LoadingComponent";
import InitView from "./view/InitView";
import LayoutView from "./view/LayoutView";

// Utils
import { request, requestEvent } from "./util/request";

const App: React.FC = () => {
    const [isInited, updateIsInited] = useState(false);

    useEffect(() => {
        IsInitedStore.subscribe(() => {
            updateIsInited(IsInitedStore.getState());
        });

        requestEvent("bot:connected", () => {
            IsConnectedStore.dispatch({ type: "ENABLE" });
        });
        requestEvent("bot:disconnected", () => {
            IsConnectedStore.dispatch({ type: "DISABLE" });
        });

        (async () => {
            IsConnectingStore.dispatch({ type: "ENABLE" });

            const isInited: boolean = await request("get:init", null, true);
            IsInitedStore.dispatch({ type: "UPDATE", state: isInited });

            IsConnectingStore.dispatch({ type: "DISABLE" });
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
