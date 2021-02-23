import React from "react";
import moment from "moment";

// Store
import {
    ChannelTemplateRowType,
    updateAction as updateChannelTemplate,
} from "../store/ChannelTemplate";
import { updateAction as updateChannelTitle } from "../store/ChannelTitle";
import { updateAction as updateChannelGame } from "../store/ChannelGame";
import { updateAction as updateChannelLanguage } from "../store/ChannelLanguage";

// Utility
import { request } from "../util/request";

// Const
import { getLabel } from "../const/languages";

type Props = {
    channelTemplate: ChannelTemplateRowType;
};

const ChannelTemplateRowComponent: React.FC<Props> = ({ channelTemplate }) => {
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
                    Apply
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
