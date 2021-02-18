import React from "react";

// Store
import { HostRowType } from "../store/Hosts";

// Component
import ShoutOutButtonComponent from "./ShoutOutButtonComponent";

type Props = {
    host: HostRowType;
};

const ChatterRowComponent: React.FC<Props> = ({ host }) => {
    return (
        <tr>
            <td scope="row">{host.channel}</td>
            <td scope="row">{host.host.username}</td>
            <td>{host.host.viewers}</td>
            <td>{host.host.autohost ? "true" : "false"}</td>
            <td>
                <ShoutOutButtonComponent
                    className="btn btn-sm btn-success me-1"
                    channel={host.channel}
                    username={host.host.username}
                />
                <button className="btn btn-sm btn-danger">Delete</button>
            </td>
        </tr>
    );
};

export default ChatterRowComponent;
