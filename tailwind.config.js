module.exports = {
    purge: {
        content: [
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
