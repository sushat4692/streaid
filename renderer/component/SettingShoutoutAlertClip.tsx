import React from "react";
import { FormattedMessage } from "react-intl";

// Components
import CopyableFieldComponent from "./CopyableField";
import SectionSubHeader from "../../component/SectionSubHeader";
import SectionSubHeaderSmall from "../../component/SectionSubHeaderSmall";
import FormField from "./FormField";
import FormFieldLabel from "./FormFieldLabel";
import FormFieldHelp from "./FormFieldHelp";

const SettingShoutoutAlertClip: React.FC = () => {
    return (
        <>
            <SectionSubHeader>
                <FormattedMessage
                    id="Component.SettingShoutOutAlert.Clip.Header"
                    defaultMessage="Clip"
                />

                <SectionSubHeaderSmall>
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.Clip.Descript"
                        defaultMessage="Showing alert the streamer's clip movie"
                    />
                </SectionSubHeaderSmall>
            </SectionSubHeader>

            <FormField>
                <FormFieldLabel>
                    <FormattedMessage
                        id="Common.Label.Command"
                        defaultMessage="Command"
                    />
                </FormFieldLabel>

                <CopyableFieldComponent text="!so {user_id} clip" />
            </FormField>

            <FormField>
                <FormFieldLabel>
                    <FormattedMessage
                        id="Common.Label.StopCommand"
                        defaultMessage="Stop Command"
                    />
                </FormFieldLabel>

                <CopyableFieldComponent text="!stop" />

                <FormFieldHelp>
                    <FormattedMessage
                        id="Component.SettingShoutOutAlert.Clip.StopHelp"
                        defaultMessage="You can use this command when you want to stop the clip movie"
                    ></FormattedMessage>
                </FormFieldHelp>
            </FormField>
        </>
    );
};

export default SettingShoutoutAlertClip;
