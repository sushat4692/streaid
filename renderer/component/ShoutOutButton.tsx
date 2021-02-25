import React from "react";
import { useSetRecoilState } from "recoil";

// Recoil
import IsConnectingState from "../atom/IsConnecting";

// Util
import { request } from "../util/request";

type Props = {
    channel?: string;
    roomId?: string;
    username: string;
    className?: string;
};

const ShoutOutButtonComponent: React.FC<Props> = ({
    roomId,
    channel,
    username,
    className,
}) => {
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const clickHandler = async () => {
        updateIsConnecting(true);

        await request<
            { postRoomId?: string; postChannel?: string; username: string },
            null
        >(
            "bot:shoutout",
            { postRoomId: roomId, postChannel: channel, username },
            null
        );

        updateIsConnecting(false);
    };

    return (
        <button
            className={className || "btn btn-success"}
            onClick={clickHandler}
        >
            <i className="bi bi-speaker me-2"></i>
            ShoutOut
        </button>
    );
};

export default ShoutOutButtonComponent;
