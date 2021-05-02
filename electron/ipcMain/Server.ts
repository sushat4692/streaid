import { ipcMain } from "electron";

// Server
import { useServer } from "../server";

// Store
import { getInstance as getStoreInstance } from "../store";

ipcMain.handle("server:init", async () => {
    const server = useServer();
    const store = getStoreInstance();

    return {
        isConnected: server.getConnected(),
        httpPort: store.get("alert_http_port"),
        socketPort: store.get("alert_socket_port"),
    };
});

ipcMain.handle("server:create", async () => {
    const server = useServer();
    server.createServer();

    return server.getConnected();
});

ipcMain.handle("server:close", async () => {
    const server = useServer();
    server.closeServer();

    return server.getConnected();
});

ipcMain.handle(
    "server:port:update",
    (_, { mode, value }: { mode: string; value: number }) => {
        const store = getStoreInstance();

        switch (mode) {
            case "http":
                store.set("alert_http_port", value);
                break;
            case "socket":
                store.set("alert_socket_port", value);
                break;
        }

        return value;
    }
);
