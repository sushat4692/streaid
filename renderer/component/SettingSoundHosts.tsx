import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import InputRange from "react-input-range";

// Recoil
import SoundHostVolumeState from "../atom/SoundHostVolume";

// Util
import { useSound } from "../util/sound";
import { request } from "../util/request";

// Styles
import styles from "./SettingSound.module.css";

const SettingSoundHostsComponent: React.FC = () => {
    const [hostVolume, updateHostVolume] = useRecoilState(SoundHostVolumeState);
    const { selectFileHandler, playFileHandler } = useSound("host");

    return (
        <>
            <h3 className="section__sub-header">
                <FormattedMessage
                    id="Common.Hosts.Name"
                    defaultMessage="Hosts"
                />

                <small className="section__sub-header__small">
                    <FormattedMessage
                        id="Component.SettingSoundHosts.Descript"
                        defaultMessage="Play selected sound per hosts"
                    />
                </small>
            </h3>
            <div className={styles.row}>
                <div className={styles.row__button}>
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

                <div className={styles.row__field}>
                    <label className="form-field__label">
                        <FormattedMessage
                            id="Common.Label.Volume"
                            defaultMessage="Volume"
                        />
                    </label>

                    <div className={styles.row__field__action}>
                        <button
                            className={`btn btn-link ${styles.row__field__action__button}`}
                            onClick={playFileHandler()}
                        >
                            <i className="bi bi-play-circle" />
                        </button>
                        <InputRange
                            minValue={0}
                            maxValue={1}
                            step={0.01}
                            value={hostVolume}
                            formatLabel={(value) =>
                                `${Math.floor(value * 100)}%`
                            }
                            onChange={async (value) => {
                                updateHostVolume(value as number);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "host_volume",
                                        value: value as number,
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
