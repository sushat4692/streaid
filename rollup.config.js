// 各種プラグインを読み込む
import pluginEsbuild from "rollup-plugin-esbuild";
import pluginReplace from "@rollup/plugin-replace";

import * as dotenv from "dotenv";
dotenv.config();

/** @param {string} str */
const capitize = (str) => {
    return `${str.charAt(0).toUpperCase()}${str.substring(1).toLowerCase()}`;
};

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
                // eslint-disable-next-line no-undef
                __version__: process.env.npm_package_version,
                // eslint-disable-next-line no-undef
                __name__: capitize(process.env.npm_package_name),
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
            "@twurple/api",
            "@twurple/auth",
            "@twurple/auth-electron",
            "axios",
            "compare-versions",
            "electron",
            "electron-store",
            "electron-is-dev",
            "node-fetch",
            "path",
            "tmi.js",
            "nedb-promises",
            "fs-extra",
            "http",
            "https",
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
