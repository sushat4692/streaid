import React from "react";
import { FormattedMessage } from "react-intl";

// Type
import { VersionHistory } from "../../types/VersionHistory";

// Components
import HistoryRowComponent from "./HistoryRow";

type Props = {
    history: VersionHistory[];
    latest: string;
    locale: string;
};

const HistoryComponent = ({ history, latest, locale }: Props) => {
    return (
        <>
            <div className="page-header">
                <div className="container-fluid">
                    <div className="page-header__action">
                        <h1 className="page-header__text">
                            <FormattedMessage
                                id="History.Head"
                                defaultMessage="New version available"
                            ></FormattedMessage>{" "}
                            ( v{latest} )
                        </h1>

                        <a
                            href="https://github.com/sushat4692/twitch-support-tool/releases/latest"
                            target="_blank"
                            className="btn is-primary is-small"
                            rel="noreferrer"
                        >
                            <FormattedMessage
                                id="History.Button"
                                defaultMessage="Download"
                            ></FormattedMessage>
                        </a>
                    </div>
                </div>
            </div>

            <div className="container-fluid">
                {history.map((h, i) => {
                    return (
                        <HistoryRowComponent
                            key={i}
                            history={h}
                            locale={locale}
                        ></HistoryRowComponent>
                    );
                })}
            </div>
        </>
    );
};

export default HistoryComponent;
