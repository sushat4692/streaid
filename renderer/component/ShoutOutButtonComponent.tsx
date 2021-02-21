import React from "react";

import IsConnectingStore from "../store/IsConnecting";

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
        IsConnectingStore.dispatch({ type: "ENABLE" });

        await request<
            { postRoomId?: string; postChannel?: string; username: string },
            null
        >(
            "bot:shoutout",
            { postRoomId: roomId, postChannel: channel, username },
            null
        );

        IsConnectingStore.dispatch({ type: "DISABLE" });
    };

    return (
        <button
            className={className || "btn btn-success"}
            onClick={clickHandler}
        >
            ShoutOut
        </button>
    );
};

export default ShoutOutButtonComponent;
