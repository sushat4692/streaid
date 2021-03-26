import { app, BrowserWindow } from "electron";
import isDev from "electron-is-dev";
import path from "path";
import { readFile, stat } from "fs-extra";

// Store
import { getInstance as getStoreInstance } from "../store";

export const playSound = async (
    win: BrowserWindow | null,
    mode: "chatter" | "chat" | "raid" | "host"
) => {
    if (!win) {
        return false;
    }

    const soundFile = path.join(
        isDev ? "." : app.getPath("userData"),
        `data/${mode}.mp3`
    );

    try {
        const result = await stat(soundFile);
        if (!result.isFile()) {
            return false;
        }
    } catch {
        return false;
    }

    const store = getStoreInstance();
    const gain = store.get(`${mode}_volume`, 1);

    const source = await readFile(soundFile);
    win.webContents.send("sound:play", { source, gain });
    return true;
};
