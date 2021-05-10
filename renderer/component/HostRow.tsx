import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Types
import { HostType } from "../../types/Host";

// Recoil
import HostsState from "../atom/Hosts";

// Utility
import { request } from "../util/request";

// Component
import UserComponent from "./User";
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    host: HostType;
};

const HostsRowComponent: React.FC<Props> = ({ host }: Props) => {
    const updateHostsState = useSetRecoilState(HostsState);

    const deleteClickHandler = async () => {
        const hosts = await request("host:delete", host._id, []);

        updateHostsState([...hosts]);
    };

    return (
        <tr>
            <td scope="row">
                <UserComponent username={host.username} />
            </td>
            <td>{host.viewers}</td>
            <td>{host.autohost ? "true" : "false"}</td>
            <td>{moment(host.createdAt).format("M/D kk:mm")}</td>
            <td>
                <div className="btn-group">
                    <ShoutOutButtonComponent
                        className="btn is-small btn-success me-1"
                        username={host.username}
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

export default HostsRowComponent;
