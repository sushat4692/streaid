import { BrowserWindow } from "electron";

/**
 * Get Electron Window
 * Now only one window, so get first window from getAllWindows
 */
export const getWindow = () => {
    const wins = BrowserWindow.getAllWindows();
    if (!wins.length) {
        return null;
    }
    return wins[0];
};
