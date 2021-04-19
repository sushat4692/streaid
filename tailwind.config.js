module.exports = {
    purge: {
        content: [
            "./alert/**/*.css",
            "./alert/**/*.js",
            "./alert/**/*.jsx",
            "./alert/**/*.ts",
            "./alert/**/*.tsx",
            "./renderer/**/*.css",
            "./renderer/**/*.js",
            "./renderer/**/*.jsx",
            "./renderer/**/*.ts",
            "./renderer/**/*.tsx",
        ],
    },
    darkMode: "media", // or 'media' or 'class'
    theme: {
        fontFamily: {
            sans: ["sans-serif"],
            serif: ["serif"],
        },
        extend: {},
    },
    variants: {
        extend: {},
    },
    plugins: [],
};
