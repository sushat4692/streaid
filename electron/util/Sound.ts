import { app, BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import path from "path";
import { readFile, stat } from "fs-extra";

// Store
import { getInstance as getStoreInstance } from "../store";

export const playSound = async (
    win: BrowserWindow | null,
    mode: "chatter" | "raid" | "host"
) => {
    if (!win) {
        return;
    }

    const soundFile = path.join(
        isDev ? "." : app.getPath("userData"),
        `data/${mode}.mp3`
    );
    const result = await stat(soundFile);
    if (result.isFile()) {
        const store = getStoreInstance();
        const gain = store.get(`${mode}_volume`, 1);

        const source = await readFile(soundFile);
        win.webContents.send("sound:play", { source, gain });
    }
};
