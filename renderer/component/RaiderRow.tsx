import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Types
import { RaiderType } from "../../types/Raider";

// Recoil
import RaidersState from "../atom/Raiders";

// Utility
import { request } from "../util/request";

// Component
import UserComponent from "./User";
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    raider: RaiderType;
};

const RaiderRowComponent: React.FC<Props> = ({ raider }: Props) => {
    const updateRaidersState = useSetRecoilState(RaidersState);

    const deleteClickHandler = async () => {
        const raiders = await request("raider:delete", raider._id, []);

        updateRaidersState([...raiders]);
    };

    return (
        <tr>
            <td scope="row">
                <UserComponent username={raider.username} />
            </td>
            <td>{raider.viewers}</td>
            <td>{moment(raider.createdAt).format("M/D kk:mm")}</td>
            <td>
                <div className="btn-group">
                    <ShoutOutButtonComponent
                        className="btn is-small btn-success me-1"
                        username={raider.username}
                    />
                    <button
                        className="btn is-small is-danger"
                        onClick={deleteClickHandler}
                    >
                        <i className="bi bi-trash" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default RaiderRowComponent;
