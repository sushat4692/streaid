import React from "react";
import { useRecoilValue } from "recoil";

// Recoil
import IsConnectingState from "../atom/IsConnecting";

const LoadingComponent: React.FC = () => {
    const isConnecting = useRecoilValue(IsConnectingState);

    return isConnecting ? (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ background: "rgba(255, 255, 255, 0.8)", zIndex: 2000 }}
        >
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    ) : (
        <></>
    );
};

export default LoadingComponent;
