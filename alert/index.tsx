import React from "react";
import ReactDOM from "react-dom";
import socket from "./socket";

import App from "./App";

import "./styles.css";
import "bootstrap-icons/font/bootstrap-icons.css";

socket.onAny((event, ...args) => {
    console.log(event, args);
});

socket.connect();

ReactDOM.render(<App />, document.getElementById("root"));
