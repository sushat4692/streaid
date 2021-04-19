import http from "http";
import fs from "fs-extra";
import { Server, Socket } from "socket.io";
import { join as pathJoin } from "path";

let _socket: Socket;

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

const createSocketServer = () => {
    const httpServer = http.createServer();
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:9990",
        },
    });

    io.on("connection", (socket) => {
        _socket = socket;
    });

    io.use((socket, next) => {
        next();
    });

    httpServer.listen(9999);
};

const createHttpServer = () => {
    http.createServer((req, res) => {
        const filename = (() => {
            const filename = pathJoin(__dirname, req.url || "");

            if (
                fs.existsSync(filename) &&
                fs.statSync(filename).isDirectory()
            ) {
                return pathJoin(filename, "index.html");
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
    }).listen(9990);
};

export const createServer = () => {
    createSocketServer();
    createHttpServer();
};

export const sendSocketEmit = (mode: string, ...args) => {
    if (!_socket) {
        return;
    }

    _socket.emit(mode, ...args);
};
