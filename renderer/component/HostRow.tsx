import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Recoil
import HostsState, { HostRowType } from "../atom/Hosts";

// Utility
import { request } from "../util/request";

// Component
import UserComponent from "./User";
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    host: HostRowType;
};

const HostsRowComponent: React.FC<Props> = ({ host }: Props) => {
    const updateHostsState = useSetRecoilState(HostsState);

    const deleteClickHandler = async () => {
        const hosts = await request<
            {
                id: string;
            },
            HostRowType[]
        >("host:delete", { id: host._id }, []);

        updateHostsState([...hosts]);
    };

    return (
        <tr>
            <td scope="row">
                <UserComponent username={host.username} />
            </td>
            <td>{host.viewers}</td>
            <td>{host.autohost ? "true" : "false"}</td>
            <td>{moment(host.createdAt).format("MMM Do, kk:mm")}</td>
            <td>
                <ShoutOutButtonComponent
                    className="btn btn-sm btn-success me-1"
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

export default HostsRowComponent;
