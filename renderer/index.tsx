import React from "react";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import { RecoilRoot } from "recoil";

import App from "./App";

import "./styles.css";

// Bootstrap Icon
import "bootstrap-icons/font/bootstrap-icons.css";

// Input Range
import "react-input-range/lib/css/index.css";

Modal.setAppElement("#root");

ReactDOM.render(
    <RecoilRoot>
        <App />
    </RecoilRoot>,
    document.getElementById("root")
);
