import React, { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Types
import { ChatterType } from "../../types/Chatter";

// Recoil
import ChattersState from "../atom/Chatters";

// Utility
import { request } from "../util/request";

// Component
import UserComponent from "./User";
import ShoutOutButton from "./ShoutOutButton";
import TableRow from "./TableRow";
import TableData from "./TableData";
import ButtonGroup from "../../component/ButtonGroup";
import Button from "../../component/Button";
import Icon from "../../component/Icon";

type Props = {
    chatter: ChatterType;
};

const ChatterRowComponent: React.FC<Props> = ({ chatter }: Props) => {
    const updateChatters = useSetRecoilState(ChattersState);

    const deleteClickHandler = useCallback(async () => {
        const chatters = await request("chatter:delete", chatter._id, []);

        updateChatters([...chatters]);
    }, [chatter]);

    return (
        <TableRow>
            <TableData scope="row">
                <UserComponent username={chatter.username} />
            </TableData>
            <TableData>{chatter["display-name"]}</TableData>
            <TableData>
                {moment(chatter.createdAt).format("M/D kk:mm")}
            </TableData>
            <TableData>
                <ButtonGroup>
                    <ShoutOutButton size="small" username={chatter.username} />
                    <Button
                        size="small"
                        color="danger"
                        onClick={deleteClickHandler}
                    >
                        <Icon icon="trash" />
                    </Button>
                </ButtonGroup>
            </TableData>
        </TableRow>
    );
};

export default ChatterRowComponent;
