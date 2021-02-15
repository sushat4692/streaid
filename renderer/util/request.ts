// Types
import { IpcRendererEvent } from "electron";
import "../../types/window";

export const request = async <T, R>(
    key: string,
    args: T,
    _default: R
): Promise<R> => {
    console.log(key);

    if (typeof window.ipcRenderer === "undefined") {
        return new Promise((resolve) => resolve(_default));
    } else {
        return await window.ipcRenderer.invoke(key, args);
    }
};

export const requestSync = <T, R>(key: string, args: T, _default: R): R => {
    if (typeof window.ipcRenderer === "undefined") {
        return _default;
    } else {
        return window.ipcRenderer.sendSync(key, args);
    }
};

export const requestEvent = <R>(
    key: string,
    callback: (event: IpcRendererEvent, args: R) => void
) => {
    if (typeof window.ipcRenderer !== "undefined") {
        window.ipcRenderer.on(key, callback);
    }
};
