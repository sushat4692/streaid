import React, { useCallback } from "react";
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
import ShoutOutButton from "./ShoutOutButton";
import TableRow from "./TableRow";
import TableData from "./TableData";
import ButtonGroup from "../../component/ButtonGroup";
import Button from "../../component/Button";
import Icon from "../../component/Icon";

type Props = {
    raider: RaiderType;
};

const RaiderRowComponent: React.FC<Props> = ({ raider }: Props) => {
    const updateRaidersState = useSetRecoilState(RaidersState);

    const deleteClickHandler = useCallback(async () => {
        const raiders = await request("raider:delete", raider._id, []);

        updateRaidersState([...raiders]);
    }, [raider]);

    return (
        <TableRow>
            <TableData scope="row">
                <UserComponent username={raider.username} />
            </TableData>
            <TableData>{raider.displayname}</TableData>
            <TableData>{raider.viewers}</TableData>
            <TableData>
                {moment(raider.createdAt).format("M/D kk:mm")}
            </TableData>
            <TableData>
                <ButtonGroup>
                    <ShoutOutButton size="small" username={raider.username} />
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

export default RaiderRowComponent;
