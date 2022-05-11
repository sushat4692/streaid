import React, { useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useIntl } from "react-intl";

// Recoil
import IsConnectedState from "../atom/IsConnected";
import IsConnectingState from "../atom/IsConnecting";

// Component
import Button from "../../component/Button";
import ButtonIcon from "../../component/ButtonIcon";

// Util
import { request } from "../util/request";

type Props = {
    isBlock?: boolean;
};

const ConnectComonent: React.FC<Props> = ({ isBlock = false }: Props) => {
    const isConnected = useRecoilValue(IsConnectedState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);
    const intl = useIntl();

    const clickHandler = useCallback(async () => {
        updateIsConnecting(true);

        if (isConnected) {
            await request("bot:disconnect", {}, null);
        } else {
            await request("bot:connect", {}, null);
        }
    }, [isConnected]);

    return (
        <Button
            color={isConnected ? "danger" : "primary"}
            block={isBlock}
            onClick={clickHandler}
        >
            <ButtonIcon icon="link-45deg" />
            {isConnected
                ? intl.formatMessage({
                      id: "Component.Connect.Disable",
                      defaultMessage: "Disconnect",
                  })
                : intl.formatMessage({
                      id: "Component.Connect.Enable",
                      defaultMessage: "Connect",
                  })}
        </Button>
    );
};

export default ConnectComonent;
