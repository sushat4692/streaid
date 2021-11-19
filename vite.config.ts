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
                version: resolve(__dirname, "version.html"),
            },
        },
    },

    optimizeDeps: {
        exclude: [
            "@twurple/api",
            "@twurple/auth",
            "@twurple/auth-electron",
            "dotenv",
            "electron-is-dev",
            "electron-store",
            "fs-extra",
            "nedb-promises",
            "node-fetch",
            "tmi.js",
            "tslib",
            "fs",
            "electron-store",
            "path",
        ],
    },
});
