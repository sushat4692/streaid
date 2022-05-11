import React from "react";
import { useRecoilValue } from "recoil";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import tw from "twin.macro";

// Recoil
import IsConnectingState from "../atom/IsConnecting";

// Components
const ldsRing = keyframes`
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
`;
const Loading = tw.div`fixed inset-0 bg-white dark:bg-black bg-opacity-80 dark:bg-opacity-80 z-50 flex items-center justify-center`;
const LoadingSpinner = styled.div([
    tw`inline-block relative`,
    { width: 60, height: 60 },
]);
const LoadingSpinnerItem = styled.div([
    tw`block absolute border-solid rounded-full`,
    {
        width: 48,
        height: 48,
        borderWidth: 4,
        borderColor: `rgb(31, 41, 55) transparent transparent transparent`,
        animationName: ldsRing,
        animationDuration: `1.2s`,
        animationTimingFunction: `cubic-bezier(0.5, 0, 0.5, 1)`,
        animationIterationCount: `infinite`,
        "@media (prefers-color-scheme: dark)": {
            borderColor: `#fff transparent transparent transparent`,
        },
        "&:nth-of-type(1)": {
            animationDelay: `-0.45s`,
        },
        "&:nth-of-type(2)": {
            animationDelay: `-0.3s`,
        },
        "&:nth-of-type(3)": {
            animationDelay: `-0.15s`,
        },
    },
]);
const LoadingText = tw.span`hidden`;

const LoadingComponent: React.FC = () => {
    const isConnecting = useRecoilValue(IsConnectingState);

    return isConnecting ? (
        <Loading>
            <LoadingSpinner role="status">
                <LoadingSpinnerItem></LoadingSpinnerItem>
                <LoadingSpinnerItem></LoadingSpinnerItem>
                <LoadingSpinnerItem></LoadingSpinnerItem>
                <LoadingText>Loading...</LoadingText>
            </LoadingSpinner>
        </Loading>
    ) : (
        <></>
    );
};

export default LoadingComponent;
