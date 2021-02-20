export const list = [
    { value: "en", label: "English" },
    { value: "id", label: "Bahasa Indonesia" },
    { value: "ca", label: "Català" },
    { value: "da", label: "Dansk" },
    { value: "de", label: "Deutsch" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "it", label: "Italiano" },
    { value: "hu", label: "Magyar" },
    { value: "nl", label: "Nederlands" },
    { value: "no", label: "Norsk" },
    { value: "pl", label: "Polski" },
    { value: "pt", label: "Português" },
    { value: "ro", label: "Română" },
    { value: "sk", label: "Slovenčina" },
    { value: "fi", label: "Suomi" },
    { value: "sv", label: "Svenska" },
    { value: "tl", label: "Tagalog" },
    { value: "vi", label: "Tiếng Việt" },
    { value: "tr", label: "Türkçe" },
    { value: "cs", label: "Čeština" },
    { value: "el", label: "Ελληνικά" },
    { value: "bg", label: "Български" },
    { value: "ru", label: "Русский" },
    { value: "uk", label: "Українська" },
    { value: "ar", label: "العربية" },
    { value: "ms", label: "بهاس ملايو" },
    { value: "hi", label: "मानक हिन्दी" },
    { value: "th", label: "ภาษาไทย" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日本語" },
    { value: "zh-hk", label: "粵語" },
    { value: "ko", label: "한국어" },
    { value: "asl", label: "American Sign Language" },
    { value: "other", label: "Other" },
];

export const getLabel = (code: string) => {
    const language = list.find((row) => row.value === code);
    if (!language) {
        return null;
    }
    return language.label;
};
