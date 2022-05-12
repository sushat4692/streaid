import React, { useCallback } from "react";
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
import ShoutOutButton from "./ShoutOutButton";
import TableRow from "./TableRow";
import TableData from "./TableData";
import ButtonGroup from "../../component/ButtonGroup";
import Button from "../../component/Button";
import ButtonIcon from "../../component/ButtonIcon";

type Props = {
    usermemo: UserMemoType;
};

const UserMemoRowComponent: React.FC<Props> = ({ usermemo }: Props) => {
    const updateUserMemo = useSetRecoilState(UserMemoState);

    const deleteClickHandler = useCallback(async () => {
        const usermemos = await request("usermemo:delete", usermemo._id, []);

        updateUserMemo([...usermemos]);
    }, [usermemo]);

    return (
        <TableRow>
            <TableData scope="row">
                <UserComponent username={usermemo.username} />
            </TableData>
            <TableData>
                {moment(usermemo.createdAt).format("M/D kk:mm")}
            </TableData>
            <TableData>
                <ButtonGroup>
                    <ShoutOutButton size="small" username={usermemo.username} />
                    <Button
                        size="small"
                        color="danger"
                        onClick={deleteClickHandler}
                    >
                        <ButtonIcon icon="trash" only />
                    </Button>
                </ButtonGroup>
            </TableData>
        </TableRow>
    );
};

export default UserMemoRowComponent;
