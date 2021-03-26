import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import SoundHostVolumeState from "../atom/SoundHostVolume";

// Util
import { useSound } from "../util/sound";
import { request } from "../util/request";

const SettingSoundHostsComponent: React.FC = () => {
    const [hostVolume, updateHostVolume] = useRecoilState(SoundHostVolumeState);
    const { selectFileHandler, playFileHandler } = useSound("host");

    return (
        <>
            <h4>
                <FormattedMessage
                    id="Common.Hosts.Name"
                    defaultMessage="Hosts"
                />

                <small className="text-muted ms-3 fs-6">
                    <FormattedMessage
                        id="Component.SettingSoundHosts.Descript"
                        defaultMessage="Play selected sound per hosts"
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
                            id="host_volume"
                            min={0}
                            max={1}
                            step={0.01}
                            value={hostVolume}
                            onChange={async (e) => {
                                const value = parseFloat(e.target.value);
                                updateHostVolume(value);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "host_volume",
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

export default SettingSoundHostsComponent;
