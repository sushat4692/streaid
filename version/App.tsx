import React, { useState, useEffect } from "react";
import { IntlProvider } from "react-intl";

// Type
import { VersionHistory } from "../types/VersionHistory";

// Languages
import languages from "./lang/index";

// Utils
import { request, requestEvent } from "../renderer/util/request";

// Components
import HistoryComponent from "./components/History";

const App = () => {
    const [locale, updateLocale] = useState("en-us");
    const [messages, updateMessages] = useState(languages[locale]);
    const [latest, updateLatest] = useState<string>("");
    const [history, updateHistory] = useState<VersionHistory[]>([]);

    useEffect(() => {
        requestEvent("versions", (_, versions) => {
            updateLatest(versions.latest);
            updateHistory(versions.history);
        });

        (async () => {
            const settingLocale = await request("setting:locale", {}, "en-us");
            updateLocale(settingLocale);
        })();
    }, []);

    useEffect(() => {
        updateMessages(languages[locale]);
    }, [locale]);

    return (
        <IntlProvider messages={messages} locale={locale} defaultLocale="en-us">
            <HistoryComponent
                history={history}
                latest={latest}
                locale={locale}
            ></HistoryComponent>
        </IntlProvider>
    );
};

export default App;
