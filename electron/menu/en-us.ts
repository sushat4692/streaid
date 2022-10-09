import { app, MenuItem, MenuItemConstructorOptions, shell } from "electron";

// Util
import { getWindow } from "../util/window";

const isMac = process.platform === "darwin";

const template: (MenuItem | MenuItemConstructorOptions)[] = [
    ...(isMac
        ? [
              {
                  label: app.name,
                  submenu: [
                      {
                          role: "about",
                          label: `About ${app.name}`,
                      },
                      { role: "quit", label: `Quit ${app.name}` },
                  ],
              },
          ]
        : []),
    {
        label: "File",
        submenu: [
            isMac
                ? { role: "close", label: "Close Window" }
                : { role: "quit", label: `Quit ${app.name}` },
        ],
    },
    {
        role: "editMenu",
        label: "Edit",
    },
    {
        role: "help",
        label: "Help",
        submenu: [
            ...(!isMac
                ? [
                      {
                          role: "about",
                          label: `About ${app.name}`,
                      },
                      { type: "separator" },
                  ]
                : []),
            {
                label: "Learn More",
                click: async () => {
                    await shell.openExternal("https://streaid.vercel.app");
                },
            },
            {
                label: "Issue report",
                click: async () => {
                    await shell.openExternal(
                        "https://github.com/sushat4692/streaid/issues"
                    );
                },
            },
            {
                label: "View License",
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
