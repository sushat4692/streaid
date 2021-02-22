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

    const clickHandler = (fileName: string) => {
        return async (e: React.FormEvent) => {
            e.preventDefault();

            if (await request("setting:notification_sound", fileName, null)) {
                window.alert("Saved!");
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
            <h2>Notification Sound</h2>

            <h3>Chatter</h3>
            <div className="row align-items-center mb-0 mb-md-3">
                <div className="mb-3 mb-md-0 col-md-3">
                    <button
                        className="btn btn-success"
                        onClick={clickHandler("chatter")}
                    >
                        Select File
                    </button>
                </div>

                <div className="mb-3 mb-md-0 col-md-9">
                    <label className="form-label">Volume</label>
                    <input
                        type="range"
                        className="form-range"
                        id="chatter_volume"
                        min={0}
                        max={1}
                        step={0.1}
                        value={chatterVolume}
                        onChange={async (e) => {
                            const value = parseFloat(e.target.value);
                            updateChatterVolumeStore(value);

                            await request(
                                "setting:notification_volume",
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

            <h3>Raid</h3>
            <div className="row align-items-center mb-0 mb-md-3">
                <div className="mb-3 mb-md-0 col-md-3">
                    <button
                        className="btn btn-success"
                        onClick={clickHandler("raid")}
                    >
                        Select File
                    </button>
                </div>

                <div className="mb-3 mb-md-0 col-md-9">
                    <label className="form-label">Volume</label>
                    <input
                        type="range"
                        className="form-range"
                        id="raid_volume"
                        min={0}
                        max={1}
                        step={0.1}
                        value={raidVolume}
                        onChange={async (e) => {
                            const value = parseFloat(e.target.value);
                            updateRaidVolumeStore(value);

                            await request(
                                "setting:notification_volume",
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

            <h3>Host</h3>
            <div className="row align-items-center mb-0 mb-md-3">
                <div className="mb-3 mb-md-0 col-md-3">
                    <button
                        className="btn btn-success"
                        onClick={clickHandler("host")}
                    >
                        Select File
                    </button>
                </div>

                <div className="mb-3 mb-md-0 col-md-9">
                    <label className="form-label">Volume</label>
                    <input
                        type="range"
                        className="form-range"
                        id="host_volume"
                        min={0}
                        max={1}
                        step={0.1}
                        value={hostVolume}
                        onChange={async (e) => {
                            const value = parseFloat(e.target.value);
                            updateHostVolumeStore(value);

                            await request(
                                "setting:notification_volume",
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
        </section>
    );
};

export default SettingSoundComponent;
