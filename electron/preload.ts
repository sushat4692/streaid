import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("api", {
    invoke: async (channel, ...args) => {
        return await ipcRenderer.invoke(channel, ...args);
    },
    sendSync: (channel: string, ...args) => {
        return ipcRenderer.sendSync(channel, ...args);
    },
    on: (
        channel: string,
        callback: (event: IpcRendererEvent, ...args) => void
    ) => {
        return ipcRenderer.on(channel, callback);
    },
});
