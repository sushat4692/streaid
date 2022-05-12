import React, { useEffect, useState } from "react";
import socket from "../socket";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Types
import { UserType } from "../../types/User";

// Component
const InfoInner = styled.div(() => [
    tw`bg-gray-800 p-4 rounded transition-all duration-500`,
    { width: `36rem`, transform: `translateY(-10px)` },
]);
const Info = styled.div<{ active: boolean }>(({ active }) => [
    tw`fixed inset-0 flex items-center justify-center transition-all duration-500 bg-black bg-opacity-50`,
    active ? tw`opacity-100` : tw`opacity-0`,
    active ? { [`${InfoInner}`]: { transform: `translateY(0)` } } : null,
]);
const InfoWrap = tw.div`flex flex-col items-center justify-center`;
const InfoHead = styled.h2([
    tw`text-center text-7xl font-black mb-4 relative`,
    {
        WebkitTextFillColor: `#fff`,
        WebkitTextStrokeWidth: `16px`,
        WebkitTextStrokeColor: `#fff`,
        "&::after": [
            tw`absolute inset-0 m-auto text-gray-800 z-10`,
            {
                WebkitTextFillColor: "initial",
                WebkitTextStrokeWidth: "initial",
                WebkitTextStrokeColor: "initial",
                content: "'Please check the Streamer!'",
            },
        ],
    },
]);
const InfoFigure = tw.figure`m-0 mb-4 relative pt-[100%]`;
const InfoImage = tw.img`w-full h-full absolute inset-0 object-cover`;
const InfoName = tw.p`text-center font-bold text-5xl`;

const InfoComponent: React.FC = () => {
    const [timer, updateTimer] = useState(null);
    const [user, updateUser] = useState<UserType | null>(null);
    const [isActive, updateIsActive] = useState<boolean>(false);

    const showInfo = () => {
        updateIsActive(true);
    };

    const hideInfo = () => {
        updateIsActive(false);
    };

    useEffect(() => {
        socket.on("info", (info, length) => {
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
                }, length * 1000 - 500)
            );
        });
    }, []);

    return (
        <>
            {user ? (
                <Info active={isActive}>
                    <InfoWrap>
                        <InfoHead>Please check the Streamer!</InfoHead>
                        <InfoInner>
                            <InfoFigure>
                                <InfoImage
                                    src={user.profilePictureUrl}
                                    alt={user.displayName}
                                />
                            </InfoFigure>
                            <InfoName>{user.displayName}</InfoName>
                        </InfoInner>
                    </InfoWrap>
                </Info>
            ) : (
                ""
            )}
        </>
    );
};

export default InfoComponent;
