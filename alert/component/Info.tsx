import React, { useEffect, useState } from "react";
import cn from "classnames";
import socket from "../socket";

import styles from "./Info.module.css";

interface User {
    id: string;
    name: string;
    displayName: string;
    description: string;
    type: string;
    broadcasterType: string;
    profilePictureUrl: string;
    offlinePlaceholderUrl: string;
    views: number;
    creationDate: string;
}

const InfoComponent: React.FC = () => {
    const [timer, updateTimer] = useState(null);
    const [user, updateUser] = useState<User | null>(null);
    const [isActive, updateIsActive] = useState<boolean>(false);

    const showInfo = () => {
        updateIsActive(true);
    };

    const hideInfo = () => {
        updateIsActive(false);
    };

    useEffect(() => {
        socket.on("info", (info) => {
            if (timer !== null) {
                clearTimeout(timer);
            }

            updateUser(info);
            setTimeout(() => {
                showInfo();
            }, 1);

            updateTimer(
                setTimeout(() => {
                    hideInfo();

                    setTimeout(() => {
                        updateUser(null);
                        updateTimer(null);
                    }, 500);
                }, 7500)
            );
        });
    }, []);

    return (
        <>
            {user ? (
                <div
                    className={cn(styles.info, {
                        [styles["is-active"]]: isActive,
                    })}
                >
                    <div className={styles.info__inner}>
                        <figure className={styles.info__figure}>
                            <img src={user.profilePictureUrl} alt="" />
                        </figure>
                        <p className={styles.info__name}>{user.displayName}</p>
                    </div>
                </div>
            ) : (
                ""
            )}
        </>
    );
};

export default InfoComponent;
