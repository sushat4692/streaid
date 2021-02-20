import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
    base: "./",
    plugins: [reactRefresh()],

    optimizeDeps: {
        exclude: [
            "dotenv",
            "electron-is-dev",
            "electron-store",
            "fs-extra",
            "jsdom",
            "nedb-promises",
            "node-fetch",
            "tmi.js",
            "tslib",
            "twitch",
            "twitch-auth",
            "twitch-electron-auth-provider",
            "fs",
            "electron-store",
            "path",
        ],
    },
});
