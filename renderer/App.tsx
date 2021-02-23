import React, { useEffect, useState } from "react";

// Context
import {
    getState as getIsInited,
    subscribe as subscribeIsInited,
    updateAction as updateIsInitedStore,
} from "./store/IsInited";
import {
    enableAction as enableIsConnected,
    disableAction as disableIsConnected,
} from "./store/IsConnected";
import {
    enableAction as enableIsConnecting,
    disableAction as disableIsConnecting,
} from "./store/IsConnecting";
import {
    updateAction as updateChatter,
    ChatterRowType,
} from "./store/Chatters";
import { updateAction as updateRaiders, RaiderRowType } from "./store/Raiders";
import { updateAction as updateHosts, HostRowType } from "./store/Hosts";

// Layout
import LoadingComponent from "./component/Loading";
import InitView from "./view/Init";
import LayoutView from "./view/Layout";

// Utils
import { request, requestEvent } from "./util/request";

const App: React.FC = () => {
    const [isInited, updateIsInited] = useState(false);

    useEffect(() => {
        subscribeIsInited(() => {
            updateIsInited(getIsInited());
        });

        requestEvent("bot:connected", () => {
            enableIsConnected();
        });
        requestEvent("bot:disconnected", () => {
            disableIsConnected();
        });
        requestEvent<ChatterRowType[]>("bot:chatted", (_, values) => {
            updateChatter(values);
        });
        requestEvent<RaiderRowType[]>("bot:raided", (_, values) => {
            updateRaiders(values);
        });
        requestEvent<HostRowType[]>("bot:hosted", (_, values) => {
            updateHosts(values);
        });

        requestEvent<{ source: Uint8Array; gain: number }>(
            "sound:play",
            async (_, values) => {
                const context = new AudioContext();

                const gainNode = context.createGain();
                gainNode.gain.value = values.gain;
                gainNode.connect(context.destination);

                const source = context.createBufferSource();
                source.buffer = await context.decodeAudioData(
                    values.source.buffer
                );
                source.connect(gainNode);
                source.start(0);
            }
        );

        (async () => {
            enableIsConnecting();

            const isInited: boolean = await request("get:init", null, true);
            updateIsInitedStore(isInited);

            disableIsConnecting();
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
