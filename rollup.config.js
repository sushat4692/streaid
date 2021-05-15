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
                __twitch_api_key__: process.env.CLIENT_ID,
                __deepl_api_key__: process.env.DEEPL_API_KEY,
                __build__: process.env.BUILD,
            }),
            pluginEsbuild({
                // All options are optional
                include: /\.[jt]sx?$/, // default, inferred from `loaders` option
                exclude: /node_modules/, // default
                sourceMap: false, // default
                minify: process.env.NODE_ENV === "production",
                target: "es2017", // default, or 'es20XX', 'esnext'
                jsxFactory: "React.createElement",
                jsxFragment: "React.Fragment",
                // Like @rollup/plugin-replace
                define: {
                    __VERSION__: '"x.y.z"',
                },
                tsconfig: "tsconfig.json", // default
                // Add extra loaders
                loaders: {
                    // Add .json files support
                    // require @rollup/plugin-commonjs
                    ".json": "json",
                    // Enable JSX in .js files too
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
                // All options are optional
                include: /\.[jt]sx?$/, // default, inferred from `loaders` option
                exclude: /node_modules/, // default
                sourceMap: false, // default
                minify: process.env.NODE_ENV === "production",
                target: "es2017", // default, or 'es20XX', 'esnext'
                jsxFactory: "React.createElement",
                jsxFragment: "React.Fragment",
                // Like @rollup/plugin-replace
                define: {
                    __VERSION__: '"x.y.z"',
                },
                tsconfig: "tsconfig.json", // default
                // Add extra loaders
                loaders: {
                    // Add .json files support
                    // require @rollup/plugin-commonjs
                    ".json": "json",
                    // Enable JSX in .js files too
                    ".js": "jsx",
                },
            }),
        ],
        external: ["electron"],
    },
];
