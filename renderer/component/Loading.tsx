import React from "react";
import { useRecoilValue } from "recoil";

// Recoil
import IsConnectingState from "../atom/IsConnecting";

// Styles
import styles from "./Loading.module.css";

const LoadingComponent: React.FC = () => {
    const isConnecting = useRecoilValue(IsConnectingState);

    return isConnecting ? (
        <div className={styles.loading}>
            <div className={styles.loading__spinner} role="status">
                <div className={styles.loading__spinner__item}></div>
                <div className={styles.loading__spinner__item}></div>
                <div className={styles.loading__spinner__item}></div>
                <span className={styles.loading__text}>Loading...</span>
            </div>
        </div>
    ) : (
        <></>
    );
};

export default LoadingComponent;
