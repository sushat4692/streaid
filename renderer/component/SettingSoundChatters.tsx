import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import SoundChatterVolumeState from "../atom/SoundChatterVolume";

// Util
import { useSound } from "../util/sound";
import { request } from "../util/request";

const SettingSoundChattersComponent: React.FC = () => {
    const [chatterVolume, updateChatterVolume] = useRecoilState(
        SoundChatterVolumeState
    );
    const { selectFileHandler, playFileHandler } = useSound("chatter");

    return (
        <>
            <h4>
                <FormattedMessage
                    id="Common.Chatters.Name"
                    defaultMessage="Chatters"
                />

                <small className="text-muted ms-3 fs-6">
                    <FormattedMessage
                        id="Component.SettingSoundChatters.Descript"
                        defaultMessage="Play selected sound per the first chat per persons"
                    />
                </small>
            </h4>
            <div className="row mb-0 mb-md-3">
                <div className="mb-3 mb-md-0 col-md-2 text-center d-grid">
                    <button
                        className="btn btn-success"
                        onClick={selectFileHandler()}
                    >
                        <i className="bi bi-save me-2" />
                        <FormattedMessage
                            id="Common.Label.SelectFile"
                            defaultMessage="Select File"
                        />
                    </button>
                </div>

                <div className="mb-3 mb-md-0 col-md-10">
                    <label className="form-label">
                        <FormattedMessage
                            id="Common.Label.Volume"
                            defaultMessage="Volume"
                        />
                    </label>

                    <div className="d-flex align-items-center">
                        <button
                            className="btn btn-link me-2"
                            onClick={playFileHandler()}
                        >
                            <i className="bi bi-play-circle" />
                        </button>

                        <input
                            type="range"
                            className="form-range"
                            id="chatter_volume"
                            min={0}
                            max={1}
                            step={0.01}
                            value={chatterVolume}
                            onChange={async (e) => {
                                const value = parseFloat(e.target.value);
                                updateChatterVolume(value);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "chatter_volume",
                                        value,
                                    },
                                    null
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingSoundChattersComponent;
