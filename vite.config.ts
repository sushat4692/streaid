import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { resolve } from "path";

export default defineConfig({
    base: "./",
    plugins: [reactRefresh()],

    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                alert: resolve(__dirname, "alert.html"),
            },
        },
    },

    optimizeDeps: {
        exclude: [
            "dotenv",
            "electron-is-dev",
            "electron-store",
            "fs-extra",
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
