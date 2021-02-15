import { prependOnceListener } from "process";
import React, { useEffect, useState } from "react";
import { ChatUserstate } from "tmi.js";

type Props = {
    chatter: ChatUserstate;
};

const ChatterRowComponent: React.FC<Props> = ({ chatter }) => {
    return (
        <tr>
            <td scope="row">{chatter.username}</td>
            <td>{chatter["display-name"]}</td>
            <td>
                <button className="btn btn-sm btn-danger">Delete</button>
            </td>
        </tr>
    );
};

export default ChatterRowComponent;
