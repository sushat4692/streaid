import React from "react";
import { Helmet } from "react-helmet";
import { useIntl } from "react-intl";

type Props = {
    id?: string;
    defaultMessage?: string;
};

const MetaComponent: React.FC<Props> = ({ id, defaultMessage }: Props) => {
    const intl = useIntl();

    return (
        <Helmet>
            <title>{`${
                id ? intl.formatMessage({ id, defaultMessage }) + " - " : ""
            }${intl.formatMessage({
                id: "Common.Title",
                defaultMessage: "Twitch Support Tool",
            })}`}</title>
        </Helmet>
    );
};

export default MetaComponent;
