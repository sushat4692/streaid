import React, { useEffect, useState } from "react";
import cn from "classnames";
import socket from "../socket";
import { TwitchClip } from "react-twitch-embed";

import styles from "./Clip.module.css";

interface Clip {
    id: string;
    url: string;
    embedUrl: string;
    broadcasterId: string;
    broadcasterDisplayName: string;
    creatorId: string;
    creatorDisplayName: string;
    videoId: string;
    gameId: string;
    gameName: string;
    gameBoxArtUrl: string;
    language: string;
    title: string;
    views: number;
    creationDate: string;
    thumbnailUrl: string;
}

const InfoComponent: React.FC = () => {
    const [timer, updateTimer] = useState(null);
    const [clip, updateClip] = useState<Clip | null>(null);
    const [isActive, updateIsActive] = useState<boolean>(false);

    const showInfo = () => {
        updateIsActive(true);
    };

    const hideInfo = () => {
        updateIsActive(false);
    };

    useEffect(() => {
        socket.on("clip", (info) => {
            console.log(info);

            if (timer !== null) {
                clearTimeout(timer);
            }

            updateClip(info);
            setTimeout(() => {
                showInfo();
            }, 1);

            updateTimer(
                setTimeout(() => {
                    hideInfo();

                    setTimeout(() => {
                        updateClip(null);
                        updateTimer(null);
                    }, 500);
                }, 24500)
            );
        });
    }, []);

    return (
        <>
            {clip ? (
                <div
                    className={cn(styles.clip, {
                        [styles["is-active"]]: isActive,
                    })}
                >
                    <div className={styles.clip__inner}>
                        <figure className={styles.clip__figure}>
                            <TwitchClip
                                clip={clip.id}
                                autoplay={true}
                                muted={false}
                                parent={["localhost"]}
                                className={styles.clip__video}
                                onEnded={() => {
                                    console.log("finish");
                                }}
                            ></TwitchClip>
                        </figure>
                        <p className={styles.clip__name}>
                            {clip.broadcasterDisplayName}
                        </p>
                    </div>
                </div>
            ) : (
                ""
            )}
        </>
    );
};

export default InfoComponent;
