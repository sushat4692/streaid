import React, { useEffect, useRef, useState } from "react";
import cn from "classnames";
import socket from "../socket";

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
    const [clip, updateClip] = useState<Clip | null>(null);
    const [isActive, updateIsActive] = useState<boolean>(false);

    const showInfo = () => {
        updateIsActive(true);
    };

    const hideInfo = () => {
        updateIsActive(false);
    };

    const videoFinished = () => {
        hideInfo();

        setTimeout(() => {
            updateClip(null);
        }, 500);
    };

    useEffect(() => {
        socket.on("clip", (info) => {
            updateClip(info);
            setTimeout(() => {
                showInfo();
            }, 1);
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
                            <video
                                src={clip.thumbnailUrl.replace(
                                    "-preview-480x272.jpg",
                                    ".mp4"
                                )}
                                className={styles.clip__video}
                                autoPlay
                                onEnded={videoFinished}
                            ></video>
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
