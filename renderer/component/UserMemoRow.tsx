import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Recoil
import UserMemoState, { UserMemoRowType } from "../atom/UserMemo";

// Utility
import { request } from "../util/request";

// Component
import UserComponent from "./User";
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    usermemo: UserMemoRowType;
};

const UserMemoRowComponent: React.FC<Props> = ({ usermemo }: Props) => {
    const updateUserMemo = useSetRecoilState(UserMemoState);

    const deleteClickHandler = async () => {
        const usermemos = await request<
            {
                id: string;
            },
            UserMemoRowType[]
        >("usermemo:delete", { id: usermemo._id }, []);

        updateUserMemo([...usermemos]);
    };

    return (
        <tr>
            <td scope="row">
                <UserComponent username={usermemo.username} />
            </td>
            <td>{moment(usermemo.createdAt).format("MMM Do, kk:mm")}</td>
            <td>
                <div className="btn-group">
                    <ShoutOutButtonComponent
                        className="btn is-small btn-success me-1"
                        username={usermemo.username}
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

export default UserMemoRowComponent;
