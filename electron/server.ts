import http from "http";
import fs from "fs-extra";
import { Server } from "socket.io";
import { join as pathJoin } from "path";

// Store
import { getInstance as getStoreInstance } from "./store";

const mimeTypes = {
    html: "text/html",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    svg: "image/svg+xml",
    json: "application/json",
    js: "text/javascript",
    css: "text/css",
};

let _connected = false;
let _socketServer: Server | null = null;
let _httpServer: http.Server | null = null;

const createSocketServer = () => {
    const store = getStoreInstance();
    const socketPort = store.get("alert_socket_port");
    const httpPort = store.get("alert_http_port");

    _socketServer = new Server({
        cors: {
            origin: `http://localhost:${httpPort}`,
        },
    });

    _socketServer.listen(socketPort);
};

const createHttpServer = () => {
    const store = getStoreInstance();
    const httpPort = store.get("alert_http_port");

    _httpServer = http.createServer((req, res) => {
        const filename = (() => {
            const filename = pathJoin(__dirname, req.url || "");

            if (
                fs.existsSync(filename) &&
                fs.statSync(filename).isDirectory()
            ) {
                return pathJoin(filename, "alert.html");
            } else {
                return filename;
            }
        })();

        if (!fs.existsSync(filename)) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.write("404 Not Found\n");
            res.end();
            return;
        }

        const ext = filename.split(".").pop();
        const mimeType = mimeTypes[ext || ""] || "text/plain";
        res.writeHead(200, { "Content-Type": mimeType });

        const stream = fs.createReadStream(filename);
        stream.pipe(res);

        req.on("end", () => {
            req.socket.end();
        });
    });

    _httpServer.listen(httpPort);
};

export const useServer = () => {
    const getConnected = () => {
        return _connected;
    };

    const createServer = () => {
        if (_connected) {
            return;
        }

        createSocketServer();
        createHttpServer();

        _connected = true;
    };

    const closeServer = () => {
        if (_httpServer) {
            _httpServer.close();
        }
        if (_socketServer) {
            _socketServer.close();
        }

        _connected = false;
    };

    const sendSocketEmit = (mode: string, ...args) => {
        if (!_socketServer) {
            return;
        }

        _socketServer.sockets.emit(mode, ...args);
    };

    return {
        getConnected,
        createServer,
        closeServer,
        sendSocketEmit,
    };
};
