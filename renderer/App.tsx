import React, { useEffect } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";

// Recoil
import IsInitedState from "./atom/IsInited";
import IsConnectedState from "./atom/IsConnected";
import IsConnectingState from "./atom/IsConnecting";
import RaidersState, { RaiderRowType } from "./atom/Raiders";
import ChattersState, { ChatterRowType } from "./atom/Chatters";
import HostsState, { HostRowType } from "./atom/Hosts";

// Layout
import LoadingComponent from "./component/Loading";
import InitView from "./view/Init";
import LayoutView from "./view/Layout";

// Utils
import { request, requestEvent } from "./util/request";

const App: React.FC = () => {
    const [isInited, updateIsInited] = useRecoilState(IsInitedState);
    const updateIsConnected = useSetRecoilState(IsConnectedState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);
    const updateRaiders = useSetRecoilState(RaidersState);
    const updateChatters = useSetRecoilState(ChattersState);
    const updateHosts = useSetRecoilState(HostsState);

    useEffect(() => {
        requestEvent("bot:connected", () => {
            updateIsConnected(true);
        });
        requestEvent("bot:disconnected", () => {
            updateIsConnected(false);
        });
        requestEvent<ChatterRowType[]>("bot:chatted", (_, values) => {
            updateChatters([...values]);
        });
        requestEvent<RaiderRowType[]>("bot:raided", (_, values) => {
            updateRaiders([...values]);
        });
        requestEvent<HostRowType[]>("bot:hosted", (_, values) => {
            updateHosts([...values]);
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
            updateIsConnecting(true);

            const isInited: boolean = await request("get:init", null, true);
            updateIsInited(isInited);

            updateIsConnecting(false);
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
