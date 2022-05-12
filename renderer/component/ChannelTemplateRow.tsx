import React, { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";
import { FormattedMessage } from "react-intl";

// Types
import { ChannelTemplateType } from "../../types/ChannelTemplate";

// Recoil
import ChannelTemplateState from "../atom/ChannelTemplate";
import ChannelTitleState from "../atom/ChannelTitle";
import ChannelGameState from "../atom/ChannelGame";
import ChannelLanguageState from "../atom/ChannelLanguage";

// Components
import TableRow from "./TableRow";
import TableData from "./TableData";
import ButtonGroup from "../../component/ButtonGroup";
import Button from "../../component/Button";
import Icon from "../../component/Icon";

// Utility
import { request } from "../util/request";

// Const
import { getLabel } from "../const/languages";

type Props = {
    channelTemplate: ChannelTemplateType;
};

const ChannelTemplateRowComponent: React.FC<Props> = ({
    channelTemplate,
}: Props) => {
    const updateChannelTemplate = useSetRecoilState(ChannelTemplateState);
    const updateChannelTitle = useSetRecoilState(ChannelTitleState);
    const updateChannelGame = useSetRecoilState(ChannelGameState);
    const updateChannelLanguage = useSetRecoilState(ChannelLanguageState);

    const updateClickHandler = useCallback(async () => {
        updateChannelTitle(channelTemplate.title);
        updateChannelGame({
            id: channelTemplate.gameId,
            name: channelTemplate.gameName,
            boxArtUrl: channelTemplate.boxArtUrl,
        });
        updateChannelLanguage(channelTemplate.language);
    }, [channelTemplate]);

    const deleteClickHandler = useCallback(async () => {
        const templates = await request(
            "channel:template:delete",
            channelTemplate._id,
            []
        );

        updateChannelTemplate(templates);
    }, [channelTemplate]);

    return (
        <TableRow>
            <TableData scope="row">{channelTemplate.title}</TableData>
            <TableData>{channelTemplate.gameName}</TableData>
            <TableData>{getLabel(channelTemplate.language)}</TableData>
            <TableData>
                {moment(channelTemplate.createdAt).format("M/D kk:mm")}
            </TableData>
            <TableData>
                <ButtonGroup>
                    <Button
                        size="small"
                        color="primary"
                        onClick={updateClickHandler}
                    >
                        <FormattedMessage
                            id="Common.Apply"
                            defaultMessage="Apply"
                        />
                    </Button>
                    <Button size="small" onClick={deleteClickHandler}>
                        <Icon icon="trash" />
                    </Button>
                </ButtonGroup>
            </TableData>
        </TableRow>
    );
};

export default ChannelTemplateRowComponent;
