import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import SoundChatterVolumeState from "../atom/SoundChatterVolume";

// Util
import { useSound } from "../util/sound";
import { request } from "../util/request";

// Styles
import styles from "./SettingSound.module.css";

const SettingSoundChattersComponent: React.FC = () => {
    const [chatterVolume, updateChatterVolume] = useRecoilState(
        SoundChatterVolumeState
    );
    const { selectFileHandler, playFileHandler } = useSound("chatter");

    return (
        <>
            <h3 className={styles.header}>
                <FormattedMessage
                    id="Common.Chatters.Name"
                    defaultMessage="Chatters"
                />

                <small className={styles.header__small}>
                    <FormattedMessage
                        id="Component.SettingSoundChatters.Descript"
                        defaultMessage="Play selected sound per the first chat per persons"
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
