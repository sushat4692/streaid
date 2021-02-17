import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
    base: "./",
    plugins: [reactRefresh()],

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
            "fs-extra",
            "nedb-promises",
            "path",
            "electron-is-dev",
        ],
    },
});
