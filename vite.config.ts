import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import macrosPlugin from "vite-plugin-babel-macros";
import { resolve } from "path";

export default defineConfig({
    base: "./",
    plugins: [
        // reactRefresh(),
        // twstyled(),
        macrosPlugin(),
        react({
            // jsxImportSource: "@emotion/react",
            babel: {
                plugins: ["@emotion/babel-plugin"],
            },
        }),
    ],

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
