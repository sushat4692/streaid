import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Recoil
import RaidersState, { RaiderRowType } from "../atom/Raiders";

// Utility
import { request } from "../util/request";

// Component
import UserComponent from "./User";
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    raider: RaiderRowType;
};

const RaiderRowComponent: React.FC<Props> = ({ raider }: Props) => {
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
            <td scope="row">
                <UserComponent username={raider.username} />
            </td>
            <td>{raider.viewers}</td>
            <td>{moment(raider.createdAt).format("MMM Do, kk:mm")}</td>
            <td>
                <div className="btn-group">
                    <ShoutOutButtonComponent
                        className="btn is-small btn-success me-1"
                        username={raider.username}
                    />
                    <button
                        className="btn is-small btn-danger"
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
