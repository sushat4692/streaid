import { io } from "socket.io-client";

const values: { [key: string]: string } = {};
(window.location.href.split("?")[1] || "").split("&").map((val) => {
    const [k, v] = val.split("=");
    values[k] = v;
});
const port = parseInt(values.socket, 10) || 9999;

const URL = `http://localhost:${port}`;
const socket = io(URL, { autoConnect: false });

export default socket;
