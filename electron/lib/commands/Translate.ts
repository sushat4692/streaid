import fetch from "node-fetch";

// Env
import { getInstance as getStoreInstance } from "../../store";

export const deeplTranslate = async (
    _,
    text: string,
    sourceLang = "EN",
    targetLang = "JA"
) => {
    const store = getStoreInstance();
    text = text.replace(/^("|')/, "").replace(/("|')$/, "");

    const plan = store.get("deepl_plan") as "free" | "pro";
    const apiUrl = (() => {
        switch (plan) {
            case "free":
                return "https://api-free.deepl.com/v2/translate";
            case "pro":
                return "https://api.deepl.com/v2/translate";
        }
    })();

    const url = new URL(apiUrl);
    url.searchParams.append("auth_key", store.get("deepl_key"));
    url.searchParams.append("text", text);
    url.searchParams.append("source_lang", sourceLang);
    url.searchParams.append("target_lang", targetLang);

    const result = await fetch(url).catch((e) => {
        console.error(e);
    });

    if (!result) {
        return;
    }

    if (result.status >= 400) {
        console.error("Error", await result.text());
        return;
    }

    const json = await result.json();
    return json.translations[0].text;
};
