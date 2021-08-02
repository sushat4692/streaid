import { BrowserWindow } from "electron";
import { useEnv } from "./Env";

/**
 * Get Electron Window
 * Now only one window, so get first window from getAllWindows
 */
export const getWindow = () => {
    const env = useEnv();
    const win = env.get("main_window");
    if (win) {
        return win as BrowserWindow;
    }

    const wins = BrowserWindow.getAllWindows();
    if (!wins.length) {
        return null;
    }
    return wins[0];
};
