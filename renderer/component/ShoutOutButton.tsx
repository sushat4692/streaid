import React from "react";

import { enableAction, disableAction } from "../store/IsConnecting";

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
    const clickHandler = async () => {
        enableAction();

        await request<
            { postRoomId?: string; postChannel?: string; username: string },
            null
        >(
            "bot:shoutout",
            { postRoomId: roomId, postChannel: channel, username },
            null
        );

        disableAction();
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
