import React from "react";

// Store
import RaiderStore, { RaiderRowType } from "../store/Raiders";

// Component
import ShoutOutButtonComponent from "./ShoutOutButtonComponent";

type Props = {
    raider: RaiderRowType;
};

const ChatterRowComponent: React.FC<Props> = ({ raider }) => {
    const deleteClickHandler = () => {
        RaiderStore.dispatch({ type: "DELETE", state: raider });
    };

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
                <button
                    className="btn btn-sm btn-danger"
                    onClick={deleteClickHandler}
                >
                    Delete
                </button>
            </td>
        </tr>
    );
};

export default ChatterRowComponent;
