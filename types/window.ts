import { ipcRenderer } from "electron";

declare global {
    interface Window {
        ipcRenderer: typeof ipcRenderer;
        botConnected: () => void;
        botDisconnected: () => void;
    }
}
