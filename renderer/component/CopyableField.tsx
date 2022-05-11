import React from "react";
import ReactTooltip from "react-tooltip";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FormattedMessage } from "react-intl";

// Components
import FormGroup from "./FormGroup";
import FormInputText from "./FormInputText";
import Button from "../../component/Button";

type Props = {
    text: string;
    isLarge?: boolean;
};

const CopyableField: React.FC<Props> = ({ text, isLarge }: Props) => {
    return (
        <FormGroup>
            <FormInputText type="text" value={text} readOnly large={isLarge} />

            <ReactTooltip
                place="top"
                type="dark"
                effect="solid"
                event="click"
                eventOff="mouseout"
                isCapture
            />
            <CopyToClipboard text={text} onCopy={() => console.log("")}>
                <Button data-tip="Copied!">
                    <FormattedMessage id="Common.Copy" defaultMessage="Copy" />
                </Button>
            </CopyToClipboard>
        </FormGroup>
    );
};

export default CopyableField;
