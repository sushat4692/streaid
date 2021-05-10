import React, { useState } from "react";
import { useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import cn from "classnames";

// Recoil
import IsConnectingState from "../atom/IsConnecting";

// Util
import { request } from "../util/request";

type Props = {
    username: string;
    className?: string;
};

import styles from "./ShoutOutButton.module.css";

const ShoutOutButtonComponent: React.FC<Props> = ({
    username,
    className,
}: Props) => {
    const [isShowNav, updateIsShowNav] = useState(false);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const clickHandler = (showWindow: string | null = null) => {
        return async () => {
            updateIsConnecting(true);

            await request("bot:shoutout", { username, showWindow }, null);

            updateIsConnecting(false);
        };
    };

    const toggleNavHandler = () => {
        updateIsShowNav(!isShowNav);
    };

    return (
        <>
            <button
                className={className || "btn btn-success"}
                onClick={clickHandler()}
            >
                <i className="bi bi-speaker btn__icon" />
                <FormattedMessage
                    id="Common.Label.ShoutOut"
                    defaultMessage="ShoutOut"
                />
            </button>
            <div className={styles.wrap}>
                <button
                    className={className || "btn btn-success"}
                    onClick={toggleNavHandler}
                >
                    <i className="bi bi-caret-down-fill btn__icon-only"></i>
                </button>

                <div
                    className={cn({
                        [styles.nav]: true,
                        [styles["is-active"]]: isShowNav,
                    })}
                >
                    <button
                        className={styles.nav__item}
                        onClick={clickHandler("info")}
                    >
                        Show Info
                    </button>
                    <button
                        className={styles.nav__item}
                        onClick={clickHandler("clip")}
                    >
                        Show Clip
                    </button>
                </div>
            </div>
        </>
    );
};

export default ShoutOutButtonComponent;
