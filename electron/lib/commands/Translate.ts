import fetch from "node-fetch";

// Env
import { useEnv } from "../../util/Env";

export const deeplTranslate = async (
    text: string,
    sourceLang = "EN",
    targetLang = "JA"
) => {
    const env = useEnv();
    text = text.replace(/^("|')/, "").replace(/("|')$/, "");

    const url = new URL("https://api-free.deepl.com/v2/translate");
    url.searchParams.append("auth_key", env.get("deepl_api_key") as string);
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
