import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useIntl } from "react-intl";

// Recoil
import IsConnectedState from "../atom/IsConnected";
import IsConnectingState from "../atom/IsConnecting";

// Util
import { request } from "../util/request";

type Props = {
    isBlock?: boolean;
};

const ConnectComonent: React.FC<Props> = ({ isBlock = false }: Props) => {
    const isConnected = useRecoilValue(IsConnectedState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);
    const intl = useIntl();

    const clickHandler = async () => {
        updateIsConnecting(true);

        if (isConnected) {
            await request("bot:disconnect", {}, null);
        } else {
            await request("bot:connect", {}, null);
        }
    };

    return (
        <button
            className={`btn ${isConnected ? "is-danger" : "is-primary"} ${
                isBlock ? "is-block" : ""
            }`}
            onClick={clickHandler}
        >
            <i className="bi bi-link-45deg btn__icon" />
            {isConnected
                ? intl.formatMessage({
                      id: "Component.Connect.Disable",
                      defaultMessage: "Disconnect",
                  })
                : intl.formatMessage({
                      id: "Component.Connect.Enable",
                      defaultMessage: "Connect",
                  })}
        </button>
    );
};

export default ConnectComonent;
