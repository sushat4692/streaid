import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";
import { FormattedMessage } from "react-intl";

// Recoil
import ChannelTemplateState, {
    ChannelTemplateRowType,
} from "../atom/ChannelTemplate";
import ChannelTitleState from "../atom/ChannelTitle";
import ChannelGameState from "../atom/ChannelGame";
import ChannelLanguageState from "../atom/ChannelLanguage";

// Utility
import { request } from "../util/request";

// Const
import { getLabel } from "../const/languages";

type Props = {
    channelTemplate: ChannelTemplateRowType;
};

const ChannelTemplateRowComponent: React.FC<Props> = ({ channelTemplate }) => {
    const updateChannelTemplate = useSetRecoilState(ChannelTemplateState);
    const updateChannelTitle = useSetRecoilState(ChannelTitleState);
    const updateChannelGame = useSetRecoilState(ChannelGameState);
    const updateChannelLanguage = useSetRecoilState(ChannelLanguageState);

    const updateClickHandler = async () => {
        updateChannelTitle(channelTemplate.title);
        updateChannelGame({
            id: channelTemplate.gameId,
            name: channelTemplate.gameName,
            boxArtUrl: channelTemplate.boxArtUrl,
        });
        updateChannelLanguage(channelTemplate.language);
    };

    const deleteClickHandler = async () => {
        const templates = await request<
            {
                id: string;
            },
            ChannelTemplateRowType[]
        >("channel:template:delete", { id: channelTemplate._id }, []);

        updateChannelTemplate(templates);
    };

    return (
        <tr>
            <td scope="row">{channelTemplate.title}</td>
            <td>{channelTemplate.gameName}</td>
            <td>{getLabel(channelTemplate.language)}</td>
            <td>{moment(channelTemplate.createdAt).format("MMM Do, kk:mm")}</td>
            <td>
                <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={updateClickHandler}
                >
                    <FormattedMessage
                        id="Common.Apply"
                        defaultMessage="Apply"
                    />
                </button>
                <button
                    className="btn btn-sm btn-danger"
                    onClick={deleteClickHandler}
                >
                    <i className="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    );
};

export default ChannelTemplateRowComponent;
