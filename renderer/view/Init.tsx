import React from "react";
import { useSetRecoilState } from "recoil";

// Recoil
import IsInitedState from "../atom/IsInited";

// Utils
import { request } from "../util/request";

const InitComponent: React.FC = () => {
    const updateIsInited = useSetRecoilState(IsInitedState);

    const clickHandler = async () => {
        await request("settings:get", null, null);
        updateIsInited(true);
    };

    return (
        <div className="container-fluid">
            <section className="d-flex justify-content-center align-items-center py-4">
                <div
                    style={{
                        width: "100%",
                        maxWidth: "330px",
                        padding: "15px",
                        margin: "auto",
                    }}
                >
                    <h1 className="h3 mb-3 text-center">Signin to Twitch</h1>
                    <button
                        className="w-100 btn btn-lg btn-primary"
                        onClick={clickHandler}
                    >
                        Signin
                    </button>
                </div>
            </section>
        </div>
    );
};

export default InitComponent;
