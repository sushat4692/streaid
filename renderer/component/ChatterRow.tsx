import React from "react";
import moment from "moment";

// Store
import { updateAction, ChatterRowType } from "../store/Chatters";

// Utility
import { request } from "../util/request";

// Component
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    chatter: ChatterRowType;
};

const ChatterRowComponent: React.FC<Props> = ({ chatter }) => {
    const deleteClickHandler = async () => {
        const chatters = await request<
            {
                id: string;
            },
            ChatterRowType[]
        >("chatter:delete", { id: chatter._id }, []);

        updateAction(chatters);
    };

    return (
        <tr>
            <td scope="row">{chatter.username}</td>
            <td>{chatter["display-name"]}</td>
            <td>{moment(chatter.createdAt).format("MMM Do, kk:mm")}</td>
            <td>
                <ShoutOutButtonComponent
                    className="btn btn-sm btn-success me-1"
                    roomId={chatter["room-id"]}
                    username={chatter.username}
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
