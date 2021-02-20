import React from "react";
import moment from "moment";

// Store
import ChannelTemplateStore, {
    ChannelTemplateRowType,
} from "../store/ChannelTemplate";

import ChannelTitleStore from "../store/ChannelTitle";
import ChannelGameStore from "../store/ChannelGame";
import ChannelLanguageStore from "../store/ChannelLanguage";

// Utility
import { request } from "../util/request";

// Const
import { getLabel } from "../const/languages";

type Props = {
    channelTemplate: ChannelTemplateRowType;
};

const ChannelTemplateRowComponent: React.FC<Props> = ({ channelTemplate }) => {
    const updateClickHandler = async () => {
        ChannelTitleStore.dispatch({
            type: "UPDATE",
            state: channelTemplate.title,
        });
        ChannelGameStore.dispatch({
            type: "UPDATE",
            state: {
                id: channelTemplate.gameId,
                name: channelTemplate.gameName,
                boxArtUrl: channelTemplate.boxArtUrl,
            },
        });
        ChannelLanguageStore.dispatch({
            type: "UPDATE",
            state: channelTemplate.language,
        });
    };

    const deleteClickHandler = async () => {
        const templates = await request<
            {
                id: string;
            },
            ChannelTemplateRowType[]
        >("channel:template:delete", { id: channelTemplate.id }, []);

        ChannelTemplateStore.dispatch({ type: "UPDATE", state: templates });
    };

    return (
        <tr>
            <td scope="row">{channelTemplate.title}</td>
            <td scope="row">{channelTemplate.gameName}</td>
            <td>{getLabel(channelTemplate.language)}</td>
            <td>{moment(channelTemplate.createdAt).format()}</td>
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
                    Delete
                </button>
            </td>
        </tr>
    );
};

export default ChannelTemplateRowComponent;
