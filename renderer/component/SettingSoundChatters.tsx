import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import SoundChatterVolumeState from "../atom/SoundChatterVolume";

// Util
import { useSound } from "../util/sound";
import { request } from "../util/request";

// Components
import FormInputRange from "./FormInputRange";
import SectionSubHeader from "../../component/SectionSubHeader";
import SectionSubHeaderSmall from "../../component/SectionSubHeaderSmall";
import SettingRow from "./SettingRow";
import SettingRowButton from "./SettingRowButton";
import SettingRowField from "./SettingRowField";
import SettingRowFieldAction from "./SettingRowFieldAction";
import SettingRowFieldActionButton from "./SettingRowFieldActionButton";
import FormFieldLabel from "./FormFieldLabel";
import Button from "../../component/Button";
import ButtonIcon from "../../component/ButtonIcon";

const SettingSoundChattersComponent: React.FC = () => {
    const [chatterVolume, updateChatterVolume] = useRecoilState(
        SoundChatterVolumeState
    );
    const { selectFileHandler, playFileHandler } = useSound("chatter");

    return (
        <>
            <SectionSubHeader>
                <FormattedMessage
                    id="Common.Chatters.Name"
                    defaultMessage="Chatters"
                />

                <SectionSubHeaderSmall>
                    <FormattedMessage
                        id="Component.SettingSoundChatters.Descript"
                        defaultMessage="Play selected sound per the first chat per persons"
                    />
                </SectionSubHeaderSmall>
            </SectionSubHeader>
            <SettingRow>
                <SettingRowButton>
                    <Button onClick={selectFileHandler()}>
                        <ButtonIcon icon="save" />
                        <FormattedMessage
                            id="Common.Label.SelectFile"
                            defaultMessage="Select File"
                        />
                    </Button>
                </SettingRowButton>

                <SettingRowField>
                    <FormFieldLabel>
                        <FormattedMessage
                            id="Common.Label.Volume"
                            defaultMessage="Volume"
                        />
                    </FormFieldLabel>

                    <SettingRowFieldAction>
                        <SettingRowFieldActionButton
                            onClick={playFileHandler()}
                        >
                            <ButtonIcon icon="play-circle" only />
                        </SettingRowFieldActionButton>

                        <FormInputRange
                            min={0}
                            max={1}
                            step={0.01}
                            value={chatterVolume}
                            formatLabel={(value) =>
                                `${Math.floor(value * 100)}%`
                            }
                            onChange={async (value) => {
                                updateChatterVolume(value);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "chatter_volume",
                                        value: value,
                                    },
                                    null
                                );
                            }}
                        />
                    </SettingRowFieldAction>
                </SettingRowField>
            </SettingRow>
        </>
    );
};

export default SettingSoundChattersComponent;
