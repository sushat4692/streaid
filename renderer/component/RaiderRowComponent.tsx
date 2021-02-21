import React from "react";
import moment from "moment";

// Store
import RaiderStore, { RaiderRowType } from "../store/Raiders";

// Utility
import { request } from "../util/request";

// Component
import ShoutOutButtonComponent from "./ShoutOutButtonComponent";

type Props = {
    raider: RaiderRowType;
};

const ChatterRowComponent: React.FC<Props> = ({ raider }) => {
    const deleteClickHandler = async () => {
        const raiders = await request<
            {
                id: string;
            },
            RaiderRowType[]
        >("chatter:delete", { id: raider._id }, []);

        RaiderStore.dispatch({ type: "UPDATE", state: raiders });
    };

    return (
        <tr>
            <td scope="row">{raider.username}</td>
            <td>{raider.viewers}</td>
            <td>{moment(raider.createdAt).format("MMM Do, kk:mm")}</td>
            <td>
                <ShoutOutButtonComponent
                    className="btn btn-sm btn-success me-1"
                    channel={raider.channel}
                    username={raider.username}
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
