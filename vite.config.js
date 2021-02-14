module.exports = {
    base: "./",
    jsx: "react",
    plugins: [require("vite-plugin-react")],

    optimizeDeps: {
        exclude: [
            "jsdom",
            "node-fetch",
            "encoding",
            "tslib",
            "twitch",
            "fs",
            "twitch-auth",
            "twitch-electron-auth-provider",
            "electron-store",
            "dotenv",
        ],
    },
};
