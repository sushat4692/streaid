import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Types
import { UserMemoType } from "../../types/UserMemo";

// Recoil
import UserMemoState from "../atom/UserMemo";

// Utility
import { request } from "../util/request";

// Component
import UserComponent from "./User";
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    usermemo: UserMemoType;
};

const UserMemoRowComponent: React.FC<Props> = ({ usermemo }: Props) => {
    const updateUserMemo = useSetRecoilState(UserMemoState);

    const deleteClickHandler = async () => {
        const usermemos = await request("usermemo:delete", usermemo._id, []);

        updateUserMemo([...usermemos]);
    };

    return (
        <tr>
            <td scope="row">
                <UserComponent username={usermemo.username} />
            </td>
            <td>{moment(usermemo.createdAt).format("M/D kk:mm")}</td>
            <td>
                <div className="btn-group">
                    <ShoutOutButtonComponent
                        className="btn is-small btn-success me-1"
                        username={usermemo.username}
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

export default UserMemoRowComponent;
