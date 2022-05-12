import React, { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Types
import { HostType } from "../../types/Host";

// Recoil
import HostsState from "../atom/Hosts";

// Utility
import { request } from "../util/request";

// Component
import TableRow from "./TableRow";
import TableData from "./TableData";
import ButtonGroup from "../../component/ButtonGroup";
import Button from "../../component/Button";
import Icon from "../../component/Icon";

type Props = {
    host: HostType;
};

const HostsRowComponent: React.FC<Props> = ({ host }: Props) => {
    const updateHostsState = useSetRecoilState(HostsState);

    const deleteClickHandler = useCallback(async () => {
        const hosts = await request("host:delete", host._id, []);

        updateHostsState([...hosts]);
    }, [host]);

    return (
        <TableRow>
            <TableData scope="row">{host.username}</TableData>
            <TableData>{host.viewers}</TableData>
            <TableData>{host.autohost ? "true" : "false"}</TableData>
            <TableData>{moment(host.createdAt).format("M/D kk:mm")}</TableData>
            <TableData>
                <ButtonGroup>
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

export default HostsRowComponent;
