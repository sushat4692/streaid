import React from "react";
import moment from "moment";

// Store
import { updateAction, HostRowType } from "../store/Hosts";

// Utility
import { request } from "../util/request";

// Component
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    host: HostRowType;
};

const ChatterRowComponent: React.FC<Props> = ({ host }) => {
    const deleteClickHandler = async () => {
        const hosts = await request<
            {
                id: string;
            },
            HostRowType[]
        >("chatter:delete", { id: host._id }, []);

        updateAction(hosts);
    };

    return (
        <tr>
            <td scope="row">{host.username}</td>
            <td>{host.viewers}</td>
            <td>{host.autohost ? "true" : "false"}</td>
            <td>{moment(host.createdAt).format("MMM Do, kk:mm")}</td>
            <td>
                <ShoutOutButtonComponent
                    className="btn btn-sm btn-success me-1"
                    channel={host.channel}
                    username={host.username}
                />
                <button
                    className="btn btn-sm btn-danger"
                    onClick={deleteClickHandler}
                >
                    <i className="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    );
};

export default ChatterRowComponent;
