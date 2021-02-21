import React, { useEffect, useState } from "react";
import { nanoid } from "nanoid";

// Context
import IsInitedStore from "./store/IsInited";
import IsConnectedStore from "./store/IsConnected";
import IsConnectingStore from "./store/IsConnecting";
import CattersStore, { ChatterRowType } from "./store/Chatters";
import RaidersStore, { RaiderRowType } from "./store/Raiders";
import HostsStore, { HostRowType } from "./store/Hosts";

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
        requestEvent<ChatterRowType[]>("bot:chatted", (_, values) => {
            CattersStore.dispatch({
                type: "UPDATE",
                state: values,
            });
        });
        requestEvent<RaiderRowType[]>("bot:raided", (_, values) => {
            RaidersStore.dispatch({
                type: "UPDATE",
                state: values,
            });
        });
        requestEvent<HostRowType[]>("bot:hosted", (_, values) => {
            HostsStore.dispatch({
                type: "UPDATE",
                state: values,
            });
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
