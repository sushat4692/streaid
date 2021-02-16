import React from "react";

// Store
import { ChatterRowType } from "../store/Chatters";

// Component
import ShoutOutButtonComponent from "./ShoutOutButtonComponent";

type Props = {
    chatter: ChatterRowType;
};

const ChatterRowComponent: React.FC<Props> = ({ chatter }) => {
    return (
        <tr>
            <td scope="row">{chatter.channel}</td>
            <td scope="row">{chatter.userstate.username}</td>
            <td>{chatter.userstate["display-name"]}</td>
            <td>
                <ShoutOutButtonComponent
                    className="btn btn-sm btn-success me-1"
                    channel={chatter.channel}
                    username={chatter.userstate.username}
                />
                <button className="btn btn-sm btn-danger">Delete</button>
            </td>
        </tr>
    );
};

export default ChatterRowComponent;
