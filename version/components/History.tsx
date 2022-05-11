import React from "react";
import { FormattedMessage } from "react-intl";

// Type
import { VersionHistory } from "../../types/VersionHistory";

// Components
import HistoryRow from "./HistoryRow";
import Container from "../../component/Container";
import PageHeader from "../../component/PageHeader";
import Button from "../../component/Button";
const Anchor = Button.withComponent("a");

type Props = {
    history: VersionHistory[];
    latest: string;
    locale: string;
};

const HistoryComponent = ({ history, latest, locale }: Props) => {
    return (
        <>
            <PageHeader
                action={
                    <Anchor
                        size="small"
                        color="primary"
                        href="https://github.com/sushat4692/twitch-support-tool/releases/latest"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <FormattedMessage
                            id="History.Button"
                            defaultMessage="Download"
                        ></FormattedMessage>
                    </Anchor>
                }
            >
                <FormattedMessage
                    id="History.Head"
                    defaultMessage="New version available"
                ></FormattedMessage>{" "}
                ( v{latest} )
            </PageHeader>

            <Container>
                {history.map((h, i) => {
                    return (
                        <HistoryRow
                            key={i}
                            history={h}
                            locale={locale}
                        ></HistoryRow>
                    );
                })}
            </Container>
        </>
    );
};

export default HistoryComponent;
