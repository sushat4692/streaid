import React from "react";
import ReactDOM from "react-dom";
import { RecoilRoot } from "recoil";

import App from "./App";

import "bootstrap/scss/bootstrap.scss";
import "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

ReactDOM.render(
    <RecoilRoot>
        <App />
    </RecoilRoot>,
    document.getElementById("root")
);
