import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import SoundHostVolumeState from "../atom/SoundHostVolume";

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

const SettingSoundHostsComponent: React.FC = () => {
    const [hostVolume, updateHostVolume] = useRecoilState(SoundHostVolumeState);
    const { selectFileHandler, playFileHandler } = useSound("host");

    return (
        <>
            <SectionSubHeader>
                <FormattedMessage
                    id="Common.Hosts.Name"
                    defaultMessage="Hosts"
                />

                <SectionSubHeaderSmall>
                    <FormattedMessage
                        id="Component.SettingSoundHosts.Descript"
                        defaultMessage="Play selected sound per hosts"
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
                            value={hostVolume}
                            formatLabel={(value) =>
                                `${Math.floor(value * 100)}%`
                            }
                            onChange={async (value) => {
                                updateHostVolume(value);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "host_volume",
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

export default SettingSoundHostsComponent;
