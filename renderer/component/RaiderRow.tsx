import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Recoil
import RaidersState, { RaiderRowType } from "../atom/Raiders";

// Utility
import { request } from "../util/request";

// Component
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    raider: RaiderRowType;
};

const ChatterRowComponent: React.FC<Props> = ({ raider }) => {
    const updateRaidersState = useSetRecoilState(RaidersState);

    const deleteClickHandler = async () => {
        const raiders = await request<
            {
                id: string;
            },
            RaiderRowType[]
        >("raider:delete", { id: raider._id }, []);

        updateRaidersState([...raiders]);
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
                    <i className="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    );
};

export default ChatterRowComponent;
