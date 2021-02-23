// Types
import { IpcRendererEvent } from "electron";
import "../../types/window";

export const request = async <T, R>(
    key: string,
    args: T,
    _default: R
): Promise<R> => {
    console.log(key);

    if (typeof window.api === "undefined") {
        return new Promise((resolve) => resolve(_default));
    } else {
        return await window.api.invoke<R>(key, args);
    }
};

export const requestSync = <T, R>(key: string, args: T, _default: R): R => {
    if (typeof window.api === "undefined") {
        return _default;
    } else {
        return window.api.sendSync<R>(key, args);
    }
};

export const requestEvent = <T>(
    key: string,
    callback: (event: IpcRendererEvent, args: T) => void
) => {
    if (typeof window.api !== "undefined") {
        window.api.on(key, callback);
    }
};
