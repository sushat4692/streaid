import React, { useEffect, useState } from "react";

// Store
import {
    getState as getChatterVolume,
    subscribe as subscribeChatterVolume,
    updateAction as updateChatterVolumeStore,
} from "../store/SoundChatterVolume";
import {
    getState as getRaidVolume,
    subscribe as subscribeRaidVolume,
    updateAction as updateRaidVolumeStore,
} from "../store/SoundRaidVolume";
import {
    getState as getHostVolume,
    subscribe as subscribeHostVolume,
    updateAction as updateHostVolumeStore,
} from "../store/SoundHostVolume";

// Util
import { request } from "../util/request";

const SettingSoundComponent: React.FC = () => {
    const [chatterVolume, updateChatterVolume] = useState(getChatterVolume());
    const [raidVolume, updateRaidVolume] = useState(getRaidVolume());
    const [hostVolume, updateHostVolume] = useState(getHostVolume());

    const selectFileHandler = (mode: string) => {
        return async (e: React.MouseEvent) => {
            e.preventDefault();

            if (await request("setting:notification:sound", mode, null)) {
                window.alert("Saved!");
            }
        };
    };

    const playFileHandler = (mode: string) => {
        return async (e: React.MouseEvent) => {
            e.preventDefault();

            if (!(await request("setting:notification:play", mode, false))) {
                window.alert("Sound file is not defined!");
            }
        };
    };

    useEffect(() => {
        subscribeChatterVolume(() => {
            updateChatterVolume(getChatterVolume());
        });
        subscribeRaidVolume(() => {
            updateRaidVolume(getRaidVolume());
        });
        subscribeHostVolume(() => {
            updateHostVolume(getHostVolume());
        });
    }, []);

    return (
        <section className="my-4">
            <h3>Notification Sound</h3>

            <h4>Chatter</h4>
            <div className="row mb-0 mb-md-3">
                <div className="mb-3 mb-md-0 col-md-2 text-center d-grid">
                    <button
                        className="btn btn-success"
                        onClick={selectFileHandler("chatter")}
                    >
                        <i className="bi bi-save me-2"></i>
                        Select File
                    </button>
                </div>

                <div className="mb-3 mb-md-0 col-md-10">
                    <label className="form-label">Volume</label>

                    <div className="d-flex align-items-center">
                        <button
                            className="btn btn-link me-2"
                            onClick={playFileHandler("chatter")}
                        >
                            <i className="bi bi-play-circle"></i>
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
                                updateChatterVolumeStore(value);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "chatter_volume",
                                        value,
                                    },
                                    null
                                );
                            }}
                        ></input>
                    </div>
                </div>
            </div>

            <h4>Raid</h4>
            <div className="row mb-0 mb-md-3">
                <div className="mb-3 mb-md-0 col-md-2 text-center d-grid">
                    <button
                        className="btn btn-success"
                        onClick={selectFileHandler("raid")}
                    >
                        <i className="bi bi-save me-2"></i>
                        Select File
                    </button>
                </div>

                <div className="mb-3 mb-md-0 col-md-10">
                    <label className="form-label">Volume</label>

                    <div className="d-flex align-items-center">
                        <button
                            className="btn btn-link me-2"
                            onClick={playFileHandler("raid")}
                        >
                            <i className="bi bi-play-circle"></i>
                        </button>

                        <input
                            type="range"
                            className="form-range"
                            id="raid_volume"
                            min={0}
                            max={1}
                            step={0.01}
                            value={raidVolume}
                            onChange={async (e) => {
                                const value = parseFloat(e.target.value);
                                updateRaidVolumeStore(value);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "raid_volume",
                                        value,
                                    },
                                    null
                                );
                            }}
                        ></input>
                    </div>
                </div>
            </div>

            <h4>Host</h4>
            <div className="row mb-0 mb-md-3">
                <div className="mb-3 mb-md-0 col-md-2 text-center d-grid">
                    <button
                        className="btn btn-success"
                        onClick={selectFileHandler("host")}
                    >
                        <i className="bi bi-save me-2"></i>
                        Select File
                    </button>
                </div>

                <div className="mb-3 mb-md-0 col-md-10">
                    <label className="form-label">Volume</label>

                    <div className="d-flex align-items-center">
                        <button
                            className="btn btn-link me-2"
                            onClick={playFileHandler("host")}
                        >
                            <i className="bi bi-play-circle"></i>
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
                                updateHostVolumeStore(value);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "host_volume",
                                        value,
                                    },
                                    null
                                );
                            }}
                        ></input>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SettingSoundComponent;
