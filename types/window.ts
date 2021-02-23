import { IpcRendererEvent } from "electron";

declare global {
    interface Window {
        api: {
            invoke: <R>(channel: string, ...args: any[]) => Promise<R>;
            sendSync: <R>(channel: string, ...args: any[]) => R;
            on: (
                channel: string,
                callback: (event: IpcRendererEvent, ...args) => void
            ) => void;
        };
        botConnected: () => void;
        botDisconnected: () => void;
    }
}
