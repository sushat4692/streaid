import { app, MenuItem, MenuItemConstructorOptions, shell } from "electron";

// Util
import { getWindow } from "../util/window";

const isMac = process.platform === "darwin";

const template: (MenuItem | MenuItemConstructorOptions)[] = [
    ...(isMac
        ? [
              {
                  label: app.name,
                  submenu: [{ role: "quit", label: `${app.name}を終了` }],
              },
          ]
        : []),
    {
        label: "ファイル",
        submenu: [
            isMac
                ? { role: "close", label: "ウィンドウを閉じる" }
                : { role: "quit", label: `${app.name}を終了` },
        ],
    },
    {
        role: "help",
        label: "ヘルプ",
        submenu: [
            {
                label: "詳細はこちら",
                click: async () => {
                    await shell.openExternal(
                        "https://twitch-support-tool-docs.vercel.app/jp"
                    );
                },
            },
            {
                label: "問題を報告",
                click: async () => {
                    await shell.openExternal(
                        "https://github.com/sushat4692/twitch-support-tool/issues"
                    );
                },
            },
            {
                label: "ライセンス",
                click: async () => {
                    const win = getWindow();
                    if (win) {
                        win.webContents.send("linkto", "/license");
                    }
                },
            },
            { type: "separator" },
            { role: "toggleDevTools" },
        ],
    },
];

export default template;
