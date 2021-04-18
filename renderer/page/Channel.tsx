import React, { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Select, { OptionTypeBase } from "react-select";
import AsyncSelect from "react-select/async";
import { FormattedMessage, useIntl } from "react-intl";

// Recoil
import SettingChannelState from "../atom/SettingChannel";
import ChannelTitleState from "../atom/ChannelTitle";
import ChannelGameState, { GameInterface } from "../atom/ChannelGame";
import ChannelLanguageState from "../atom/ChannelLanguage";
import ChannelTagsState, { TagInterface } from "../atom/ChannelTags";
import ChannelTemplateState, {
    ChannelTemplateRowType,
} from "../atom/ChannelTemplate";
import IsConnectingState from "../atom/IsConnecting";

// Utility
import { request } from "../util/request";

// Const
import { list as languageList } from "../const/languages";

// Components
import MetaComponent from "../component/Meta";
import ChannelTemplateRowComponent from "../component/ChannelTemplateRow";

// Styles
import styles from "./Channel.module.css";

interface ChannelInterface {
    id: string;
    name: string;
    displayName: string;
    language: string;
    gameId: string;
    gameName: string;
    title: string;
    tags: TagInterface[];
}

const ChannelPage: React.FC = () => {
    const intl = useIntl();

    const channel = useRecoilValue(SettingChannelState);
    const [title, updateTitle] = useRecoilState(ChannelTitleState);
    const [game, updateGame] = useRecoilState(ChannelGameState);
    const [language, updateLanguage] = useRecoilState(ChannelLanguageState);
    const [tags, updateTags] = useRecoilState(ChannelTagsState);
    const [channelTemplates, updateChannelTemplates] = useRecoilState(
        ChannelTemplateState
    );
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const [isLoaded, updateIsLoaded] = useState(false);
    const [
        defaultGameOption,
        updateDefaultGameOption,
    ] = useState<GameInterface>(null);
    const [
        defaultLanguageOption,
        updateDefaultLanguageOption,
    ] = useState<OptionTypeBase>(null);
    const [tagOption, _updateTagOption] = useState<TagInterface[]>([]);

    const getChannelInformation = async () => {
        updateIsConnecting(true);

        const Channel = await request<
            { username: string },
            ChannelInterface | false
        >(
            "channel:info",
            { username: channel },
            {
                id: "id",
                name: "",
                title: "Channel title",
                displayName: "",
                language: "ja",
                gameId: "1",
                gameName: "Game",
                tags: [],
            }
        );

        if (Channel) {
            updateTitle(Channel.title);
            updateLanguage(Channel.language);

            const game = await request<
                { gameId: string },
                GameInterface | null
            >(
                "channel:game",
                { gameId: Channel.gameId },
                { id: "1", name: "Game", boxArtUrl: "https://example.com" }
            );

            if (game) {
                updateGame({
                    id: game.id,
                    name: game.name,
                    boxArtUrl: game.boxArtUrl,
                });

                updateDefaultGameOption({
                    id: game.id,
                    name: game.name,
                    boxArtUrl: game.boxArtUrl,
                });
            }
        }

        updateIsConnecting(false);

        return Channel;
    };

    useEffect(() => {
        (async () => {
            // Get Channel Information
            const Channel = await getChannelInformation();
            if (Channel) {
                updateTags(Channel.tags || []);

                if (Channel.language) {
                    const selectedLanguage = languageList.find(
                        (lang) => lang.value === Channel.language
                    );
                    if (selectedLanguage) {
                        updateDefaultLanguageOption(selectedLanguage);
                    }
                }
            }

            // Get tag list
            // const tagList = await request<{ username: string }, TagInterface[]>(
            //     "channel:tags",
            //     { username: channel },
            //     []
            // );
            // console.log(tagList);
            // updateTagOption(tagList);

            // Get Templates
            updateIsConnecting(true);
            const templates = await request<null, ChannelTemplateRowType[]>(
                "channel:template",
                null,
                [
                    {
                        _id: "1",
                        title: "title",
                        gameId: "1",
                        gameName: "name",
                        boxArtUrl: "",
                        language: "ja",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        _id: "2",
                        title: "title",
                        gameId: "1",
                        gameName: "name",
                        boxArtUrl: "",
                        language: "ja",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ]
            );
            updateChannelTemplates(templates || []);
            updateIsConnecting(false);

            updateIsLoaded(true);
        })();
    }, []);

    const loadGameOptions = (inputValue: string) =>
        request<{ gameName: string }, GameInterface[]>(
            "channel:games",
            { gameName: inputValue },
            [{ id: "1", name: "Game", boxArtUrl: "https://example.com" }]
        );

    const loadTagOptions = (inputValue: string) =>
        request<{ tagName: string }, TagInterface[]>(
            "channel:tags",
            { tagName: inputValue },
            [
                {
                    id: "1",
                    isAuto: true,
                    name: "Tag",
                    description: "description",
                },
            ]
        );

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();
        updateIsConnecting(true);

        await request<
            {
                username: string;
                title: string;
                gameId: string;
                language: string;
            },
            null
        >(
            "channel:update",
            {
                username: channel,
                title,
                gameId: game.id,
                language,
            },
            null
        );

        updateIsConnecting(false);
        await getChannelInformation();
    };

    const onClickSaveTemplateHandler = async (e: React.MouseEvent) => {
        e.preventDefault();
        updateIsConnecting(true);

        const templates = await request<
            {
                title: string;
                gameId: string;
                gameName: string;
                boxArtUrl: string;
                language: string;
            },
            ChannelTemplateRowType[]
        >(
            "channel:template:push",
            {
                title,
                gameId: game.id,
                gameName: game.name,
                boxArtUrl: game.boxArtUrl,
                language,
            },
            []
        );

        updateChannelTemplates(templates || []);

        updateIsConnecting(false);
    };

    return (
        <>
            <MetaComponent id="Common.Channel.Name" defaultMessage="Channel" />

            <div className="page-header">
                <div className="container-fluid">
                    <h1 className="page-header__text">
                        <i className="bi bi-camera-reels page-header__icon" />
                        <FormattedMessage
                            id="Common.Channel.Name"
                            defaultMessage="Channel"
                        />
                    </h1>
                </div>
            </div>

            <div className="container-fluid">
                <p className="section__lead">
                    <FormattedMessage
                        id="Common.Channel.Description"
                        defaultMessage="You can check/update Channel information."
                    />
                </p>

                <section className="section">
                    <h2 className="section__header">
                        <FormattedMessage
                            id="Page.Channel.Information.Header"
                            defaultMessage="Channel Information"
                        />
                    </h2>

                    {!isLoaded ? (
                        ""
                    ) : (
                        <form onSubmit={submitHandler}>
                            <div className="form-field">
                                <label
                                    htmlFor="title"
                                    className="form-field__label"
                                >
                                    <FormattedMessage
                                        id="Common.Label.Title"
                                        defaultMessage="Title"
                                    />
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    className="form-control is-large"
                                    value={title}
                                    onChange={(e) =>
                                        updateTitle(e.target.value)
                                    }
                                />
                            </div>

                            <div className="form-field">
                                <label
                                    htmlFor="gameId"
                                    className="form-field__label"
                                >
                                    <FormattedMessage
                                        id="Common.Label.Category"
                                        defaultMessage="Category"
                                    />
                                </label>

                                <div className={styles.category}>
                                    {game ? (
                                        <figure
                                            className={styles.category__figure}
                                            style={{ width: "52px" }}
                                        >
                                            <img
                                                src={game.boxArtUrl
                                                    .replace("{width}", "138")
                                                    .replace("{height}", "190")}
                                                className="img-fluid"
                                                alt={game.name}
                                            />
                                        </figure>
                                    ) : (
                                        ""
                                    )}
                                    <span>{game.name}</span>
                                </div>

                                <AsyncSelect
                                    cacheOptions={true}
                                    defaultValue={defaultGameOption}
                                    defaultGameOptions={
                                        defaultGameOption
                                            ? [defaultGameOption]
                                            : []
                                    }
                                    value={game}
                                    getOptionLabel={(option) => option.name}
                                    getOptionValue={(option) => option.id}
                                    loadOptions={loadGameOptions}
                                    onChange={(e) => {
                                        updateGame({
                                            id: e.id,
                                            name: e.name,
                                            boxArtUrl: e.boxArtUrl,
                                        });
                                    }}
                                    placeholder={intl.formatMessage({
                                        id: "Common.Select.Placeholder",
                                        defaultMessage: "Select...",
                                    })}
                                />
                            </div>

                            <div className="form-field">
                                <label
                                    htmlFor="language"
                                    className="form-field__label"
                                >
                                    <FormattedMessage
                                        id="Common.Label.Language"
                                        defaultMessage="Language"
                                    />
                                </label>

                                <Select
                                    name="language"
                                    id="language"
                                    classNamePrefix="react-select"
                                    defaultValue={defaultLanguageOption}
                                    options={languageList}
                                    onChange={(e) => updateLanguage(e.value)}
                                    placeholder={intl.formatMessage({
                                        id: "Common.Select.Placeholder",
                                        defaultMessage: "Select...",
                                    })}
                                />
                            </div>

                            <div className="form-field">
                                <label
                                    htmlFor="tags"
                                    className="form-field__label"
                                >
                                    <FormattedMessage
                                        id="Common.Label.Tags"
                                        defaultMessage="Tags"
                                    />
                                </label>

                                <div className="alert is-warning">
                                    <FormattedMessage
                                        id="Page.Channel.Information.TagNotice"
                                        defaultMessage="Tags are not editable for now"
                                    />
                                </div>

                                <Select
                                    classNamePrefix="react-select"
                                    isMulti
                                    isDisabled
                                    options={tagOption}
                                    defaultValue={tags}
                                    getOptionLabel={(option) => option.name}
                                    getOptionValue={(option) => option.id}
                                    loadOptions={loadTagOptions}
                                    placeholder={intl.formatMessage({
                                        id: "Common.Select.Placeholder",
                                        defaultMessage: "Select...",
                                    })}
                                />
                            </div>

                            <div className="form-field__action">
                                <button
                                    type="button"
                                    className="btn btn-success me-auto"
                                    onClick={onClickSaveTemplateHandler}
                                >
                                    <FormattedMessage
                                        id="Page.Channel.Information.SaveTemplate"
                                        defaultMessage="Save to Template"
                                    />
                                </button>

                                <button
                                    type="submit"
                                    className="btn is-primary"
                                >
                                    <FormattedMessage
                                        id="Common.Submit"
                                        defaultMessage="Submit"
                                    />
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                <section className="section">
                    <h2 className="section__header">
                        <FormattedMessage
                            id="Page.Channel.Template.Header"
                            defaultMessage="Channel Template"
                        />
                    </h2>

                    <div className="table-responsive">
                        <table className="table">
                            <colgroup>
                                <col />
                                <col />
                                <col />
                                <col width="140" />
                                <col width="160" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Title"
                                            defaultMessage="Title"
                                        />
                                    </th>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Category"
                                            defaultMessage="Category"
                                        />
                                    </th>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Language"
                                            defaultMessage="Language"
                                        />
                                    </th>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Created"
                                            defaultMessage="Created"
                                        />
                                    </th>
                                    <th scope="col" />
                                </tr>
                            </thead>
                            <tbody>
                                {channelTemplates.map((channelTemplate) => (
                                    <ChannelTemplateRowComponent
                                        key={channelTemplate._id}
                                        channelTemplate={channelTemplate}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
};

export default ChannelPage;
