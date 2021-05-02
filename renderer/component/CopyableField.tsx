import React from "react";
import ReactTooltip from "react-tooltip";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FormattedMessage } from "react-intl";
import cn from "classnames";

interface Props {
    text: string;
    isLarge?: boolean;
}

const CopyableField: React.FC<Props> = ({ text, isLarge }: Props) => {
    return (
        <div className="form-control-group">
            <input
                type="text"
                value={text}
                readOnly
                className={cn({
                    "form-control": true,
                    "is-large": isLarge,
                })}
            />

            <ReactTooltip
                place="top"
                type="dark"
                effect="solid"
                event="click"
                eventOff="mouseout"
                isCapture
            />
            <CopyToClipboard text={text} onCopy={() => console.log("")}>
                <button className="btn" data-tip="Copied!">
                    <FormattedMessage id="Common.Copy" defaultMessage="Copy" />
                </button>
            </CopyToClipboard>
        </div>
    );
};

export default CopyableField;
