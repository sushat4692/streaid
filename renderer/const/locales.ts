export const list = [
    { value: "en-us", label: "English" },
    { value: "ja-jp", label: "日本語" },
];

export const getLabel = (code: string) => {
    const language = list.find((row) => row.value === code);
    if (!language) {
        return null;
    }
    return language.label;
};
