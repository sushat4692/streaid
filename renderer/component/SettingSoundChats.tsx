import React from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import SoundChatVolumeState from "../atom/SoundChatVolume";

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
    const [chatVolume, updateChatVolume] = useRecoilState(SoundChatVolumeState);
    const { selectFileHandler, playFileHandler } = useSound("chat");

    return (
        <>
            <SectionSubHeader>
                <FormattedMessage
                    id="Common.Chats.Name"
                    defaultMessage="Chats"
                />

                <SectionSubHeaderSmall>
                    <FormattedMessage
                        id="Component.SettingSoundChats.Descript"
                        defaultMessage="Play selected sound per all the chats"
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
                            value={chatVolume}
                            formatLabel={(value) =>
                                `${Math.floor(value * 100)}%`
                            }
                            onChange={async (value) => {
                                updateChatVolume(value);

                                await request(
                                    "setting:notification:volume",
                                    {
                                        mode: "chat_volume",
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
