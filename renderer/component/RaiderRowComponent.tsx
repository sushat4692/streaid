import React from "react";

// Store
import { RaiderRowType } from "../store/Raiders";

// Component
import ShoutOutButtonComponent from "./ShoutOutButtonComponent";

type Props = {
    raider: RaiderRowType;
};

const ChatterRowComponent: React.FC<Props> = ({ raider }) => {
    return (
        <tr>
            <td scope="row">{raider.channel}</td>
            <td scope="row">{raider.raider.username}</td>
            <td>{raider.raider.viewers}</td>
            <td>
                <ShoutOutButtonComponent
                    className="btn btn-sm btn-success me-1"
                    channel={raider.channel}
                    username={raider.raider.username}
                />
                <button className="btn btn-sm btn-danger">Delete</button>
            </td>
        </tr>
    );
};

export default ChatterRowComponent;
