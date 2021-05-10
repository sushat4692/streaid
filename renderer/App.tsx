import React, { useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { IntlProvider } from "react-intl";

// Languages
import languages from "./lang/index";

// Recoil
import IsInitedState from "./atom/IsInited";
import LocaleState from "./atom/Locale";
import IsConnectedState from "./atom/IsConnected";
import IsConnectingState from "./atom/IsConnecting";
import RaidersState from "./atom/Raiders";
import ChattersState from "./atom/Chatters";
import HostsState from "./atom/Hosts";

// Layout
import LoadingComponent from "./component/Loading";
import InitView from "./view/Init";
import LayoutView from "./view/Layout";

// Utils
import { request, requestEvent } from "./util/request";

const App: React.FC = () => {
    const [isInited, updateIsInited] = useRecoilState(IsInitedState);
    const [locale, updateLocale] = useRecoilState(LocaleState);
    const updateIsConnected = useSetRecoilState(IsConnectedState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);
    const updateRaiders = useSetRecoilState(RaidersState);
    const updateChatters = useSetRecoilState(ChattersState);
    const updateHosts = useSetRecoilState(HostsState);

    const [messages, updateMessages] = useState(languages[locale]);

    useEffect(() => {
        requestEvent("bot:connected", () => {
            updateIsConnected(true);
            updateIsConnecting(false);
        });
        requestEvent("bot:disconnected", () => {
            updateIsConnected(false);
            updateIsConnecting(false);
        });
        requestEvent("bot:chatted", (_, values) => {
            updateChatters([...values]);
        });
        requestEvent("bot:raided", (_, values) => {
            updateRaiders([...values]);
        });
        requestEvent("bot:hosted", (_, values) => {
            updateHosts([...values]);
        });

        requestEvent("sound:play", async (_, values) => {
            const context = new AudioContext();

            const gainNode = context.createGain();
            gainNode.gain.value = values.gain;
            gainNode.connect(context.destination);

            const source = context.createBufferSource();
            source.buffer = await context.decodeAudioData(values.source.buffer);
            source.connect(gainNode);
            source.start(0);
        });

        (async () => {
            updateIsConnecting(true);

            const settingLocale = await request("setting:locale", {}, "en-us");
            updateLocale(settingLocale);

            const isInited: boolean = await request("get:init", {}, true);
            updateIsInited(isInited);

            updateIsConnecting(false);
        })();
    }, []);

    useEffect(() => {
        updateMessages(languages[locale]);
    }, [locale]);

    return (
        <IntlProvider messages={messages} locale={locale} defaultLocale="en-us">
            {isInited ? <LayoutView /> : <InitView />}
            <LoadingComponent />
        </IntlProvider>
    );
};

export default App;
