import React, { useEffect, useState } from "react";
import socket from "../socket";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Types
import { ClipType } from "../../types/Clip";

// Component
const ClipInner = styled.div(() => [
    tw`bg-gray-800 p-4 rounded transition-all duration-500`,
    { width: `96rem`, transform: `translateY(-10px)` },
]);
const Clip = styled.div<{ active: boolean }>(({ active }) => [
    tw`fixed inset-0 flex items-center justify-center transition-all duration-500 bg-black bg-opacity-50`,
    active ? tw`opacity-100` : tw`opacity-0`,
    active ? { [`${ClipInner}`]: { transform: `translateY(0)` } } : null,
]);
const ClipFigure = styled.figure([
    tw`m-0 mb-4 relative`,
    { paddingTop: `56.25%` },
]);
const ClipVideo = tw.video`w-full h-full absolute inset-0`;
const ClipName = tw.p`text-center font-bold text-6xl`;

const InfoComponent: React.FC = () => {
    const [clip, updateClip] = useState<ClipType | null>(null);
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

        socket.on("clip:stop", () => {
            videoFinished();
        });
    }, []);

    return (
        <>
            {clip ? (
                <Clip active={isActive}>
                    <ClipInner>
                        <ClipFigure>
                            <ClipVideo
                                src={clip.thumbnailUrl.replace(
                                    "-preview-480x272.jpg",
                                    ".mp4"
                                )}
                                autoPlay
                                onEnded={videoFinished}
                            ></ClipVideo>
                        </ClipFigure>
                        <ClipName>{clip.broadcasterDisplayName}</ClipName>
                    </ClipInner>
                </Clip>
            ) : (
                ""
            )}
        </>
    );
};

export default InfoComponent;
