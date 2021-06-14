// 各種プラグインを読み込む
import pluginEsbuild from "rollup-plugin-esbuild";
import pluginReplace from "@rollup/plugin-replace";

import * as dotenv from "dotenv";
dotenv.config();

export default [
    // Electron
    {
        input: "electron/main.ts",
        output: {
            dir: "dist",
            name: "main",
            format: "cjs",
        },
        plugins: [
            pluginReplace({
                preventAssignment: true,
                // eslint-disable-next-line no-undef
                __twitch_api_key__: process.env.CLIENT_ID,
                // eslint-disable-next-line no-undef
                __build__: process.env.BUILD,
            }),
            pluginEsbuild({
                include: /\.[jt]sx?$/,
                exclude: /node_modules/,
                sourceMap: false,
                // eslint-disable-next-line no-undef
                minify: process.env.NODE_ENV === "production",
                target: "es2017",
                jsxFactory: "React.createElement",
                jsxFragment: "React.Fragment",
                define: {
                    __VERSION__: '"x.y.z"',
                },
                tsconfig: "tsconfig.json",
                loaders: {
                    ".json": "json",
                    ".js": "jsx",
                },
            }),
        ],
        external: [
            "electron",
            "electron-store",
            "electron-is-dev",
            "node-fetch",
            "path",
            "twitch",
            "twitch-electron-auth-provider",
            "tmi.js",
            "nedb-promises",
            "fs-extra",
            "http",
            "shell-quote",
            "socket.io",
            "sqlite",
            "sqlite3",
        ],
    },
    {
        input: "electron/preload.ts",
        output: {
            dir: "dist",
            name: "preload",
            format: "cjs",
        },
        plugins: [
            pluginEsbuild({
                include: /\.[jt]sx?$/,
                exclude: /node_modules/,
                sourceMap: false,
                // eslint-disable-next-line no-undef
                minify: process.env.NODE_ENV === "production",
                target: "es2017",
                jsxFactory: "React.createElement",
                jsxFragment: "React.Fragment",
                define: {
                    __VERSION__: '"x.y.z"',
                },
                tsconfig: "tsconfig.json",
                loaders: {
                    ".json": "json",
                    ".js": "jsx",
                },
            }),
        ],
        external: ["electron"],
    },
];
