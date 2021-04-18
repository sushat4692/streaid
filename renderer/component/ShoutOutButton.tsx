import React from "react";
import { useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import IsConnectingState from "../atom/IsConnecting";

// Util
import { request } from "../util/request";

type Props = {
    username: string;
    className?: string;
};

const ShoutOutButtonComponent: React.FC<Props> = ({
    username,
    className,
}: Props) => {
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const clickHandler = async () => {
        updateIsConnecting(true);

        await request<string, null>("bot:shoutout", username, null);

        updateIsConnecting(false);
    };

    return (
        <button
            className={className || "btn btn-success"}
            onClick={clickHandler}
        >
            <i className="bi bi-speaker btn__icon" />
            <FormattedMessage
                id="Common.Label.ShoutOut"
                defaultMessage="ShoutOut"
            />
        </button>
    );
};

export default ShoutOutButtonComponent;
