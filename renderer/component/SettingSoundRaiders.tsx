import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import InputRange from "react-input-range";

// Recoil
import SoundRaidVolumeState from "../atom/SoundRaidVolume";

// Util
import { useSound } from "../util/sound";
import { request } from "../util/request";

// Styles
import styles from "./SettingSound.module.css";

const SettingSoundRaidersComponent: React.FC = () => {
    const [raidVolume, updateRaidVolume] = useRecoilState(SoundRaidVolumeState);
    const { selectFileHandler, playFileHandler } = useSound("raid");

    return (
        <>
            <h3 className={styles.header}>
                <FormattedMessage
                    id="Common.Raiders.Name"
                    defaultMessage="Raiders"
                />

                <small className={styles.header__small}>
                    <FormattedMessage
                        id="Component.SettingSoundRaiders.Descript"
                        defaultMessage="Play selected sound per raids"
                    />
                </small>
            </h3>
            <div className={styles.row}>
                <div className={styles.row__button}>
                    <button
                        className="btn btn-success"
                        onClick={selectFileHandler()}
                    >
                        <i className="bi bi-save btn__icon" />
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
                            value={raidVolume}
                            formatLabel={(value) =>
                                `${Math.floor(value * 100)}%`
                            }
                            onChange={async (value) => {
                                updateRaidVolume(value as number);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "raid_volume",
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

export default SettingSoundRaidersComponent;
