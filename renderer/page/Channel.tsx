import React, { useCallback, useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Select, { PropsValue } from "react-select";
import AsyncSelect from "react-select/async";
import { FormattedMessage, useIntl } from "react-intl";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Types
import { TagType } from "../../types/Tag";
import { GameType } from "../../types/Game";
import { DefaultSelectType } from "../../types/DefaultSelect";

// Recoil
import SettingChannelState from "../atom/SettingChannel";
import ChannelTitleState from "../atom/ChannelTitle";
import ChannelGameState from "../atom/ChannelGame";
import ChannelLanguageState from "../atom/ChannelLanguage";
import ChannelTagsState from "../atom/ChannelTags";
import ChannelTemplateState from "../atom/ChannelTemplate";
import IsConnectingState from "../atom/IsConnecting";

// Utility
import { request } from "../util/request";

// Const
import { list as languageList } from "../const/languages";
import { selectStyles } from "../const/selectStyles";
const gameStyle = selectStyles<GameType, false>();
const languageStyle = selectStyles<DefaultSelectType, false>();
const tagStyle = selectStyles<TagType, true>();

// Components
import Meta from "../component/Meta";
import ChannelTemplateRow from "../component/ChannelTemplateRow";
import PageHeader from "../../component/PageHeader";
import Container from "../../component/Container";
import Alert from "../../component/Alert";
import Button from "../../component/Button";
import Section from "../../component/Section";
import SectionLead from "../../component/SectionLead";
import SectionHeader from "../../component/SectionHeader";
import FormField from "../component/FormField";
import FormFieldLabel from "../component/FormFieldLabel";
import FormInputText from "../component/FormInputText";
import FormFieldAction from "../component/FormFieldAction";
import TableResponsive from "../component/TableResponsive";
import Table from "../component/Table";
import TableThead from "../component/TableThead";
import TableRow from "../component/TableRow";
import TableHead from "../component/TableHead";
import TableTbody from "../component/TableTbody";
const Category = tw.div`flex mb-2 items-center`;
const CategoryFigure = styled.figure([{ width: 52 }, tw`m-0 mr-2`]);

const ChannelPage: React.FC = () => {
    const intl = useIntl();

    const channel = useRecoilValue(SettingChannelState);
    const [title, updateTitle] = useRecoilState(ChannelTitleState);
    const [game, updateGame] = useRecoilState(ChannelGameState);
    const [language, updateLanguage] = useRecoilState(ChannelLanguageState);
    const [tags, updateTags] = useRecoilState(ChannelTagsState);
    const [channelTemplates, updateChannelTemplates] =
        useRecoilState(ChannelTemplateState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const [isLoaded, updateIsLoaded] = useState(false);
    const [defaultGameOption, updateDefaultGameOption] =
        useState<PropsValue<GameType>>(null);
    const [defaultLanguageOption, updateDefaultLanguageOption] =
        useState<PropsValue<DefaultSelectType>>(null);
    const [tagOption, _updateTagOption] = useState<TagType[]>([]);

    const getChannelInformation = useCallback(async () => {
        updateIsConnecting(true);

        const Channel = await request(
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

            const game = await request(
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
    }, [channel]);

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
            // const tagList = await request(
            //     "channel:tags",
            //     { username: channel },
            //     []
            // );
            // console.log(tagList);
            // updateTagOption(tagList);

            // Get Templates
            updateIsConnecting(true);
            const templates = await request("channel:template", null, [
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
            ]);
            updateChannelTemplates(templates || []);
            updateIsConnecting(false);

            updateIsLoaded(true);
        })();
    }, []);

    const loadGameOptions = useCallback(
        (inputValue: string) =>
            request("channel:games", { gameName: inputValue }, [
                { id: "1", name: "Game", boxArtUrl: "https://example.com" },
            ]),
        []
    );

    // const loadTagOptions = useCallback(
    //     (inputValue: string) =>
    //         request("channel:tags", { username: inputValue }, [
    //             {
    //                 id: "1",
    //                 isAuto: true,
    //                 name: "Tag",
    //                 description: "description",
    //             },
    //         ]),
    //     []
    // );

    const submitHandler = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            updateIsConnecting(true);

            await request(
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
        },
        [channel, title, game, language]
    );

    const onClickSaveTemplateHandler = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            updateIsConnecting(true);

            const templates = await request(
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
        },
        [title, game, language]
    );

    return (
        <>
            <Meta id="Common.Channel.Name" defaultMessage="Channel" />

            <PageHeader icon="camera-reels">
                <FormattedMessage
                    id="Common.Channel.Name"
                    defaultMessage="Channel"
                />
            </PageHeader>

            <Container>
                <SectionLead>
                    <FormattedMessage
                        id="Common.Channel.Description"
                        defaultMessage="You can check/update Channel information."
                    />
                </SectionLead>

                <Section>
                    <SectionHeader>
                        <FormattedMessage
                            id="Page.Channel.Information.Header"
                            defaultMessage="Channel Information"
                        />
                    </SectionHeader>

                    {!isLoaded ? (
                        ""
                    ) : (
                        <form onSubmit={submitHandler}>
                            <FormField>
                                <FormFieldLabel htmlFor="title">
                                    <FormattedMessage
                                        id="Common.Label.Title"
                                        defaultMessage="Title"
                                    />
                                </FormFieldLabel>
                                <FormInputText
                                    large
                                    type="text"
                                    name="title"
                                    id="title"
                                    value={title}
                                    onChange={(e) =>
                                        updateTitle(e.target.value)
                                    }
                                />
                            </FormField>

                            <FormField>
                                <FormFieldLabel htmlFor="gameId">
                                    <FormattedMessage
                                        id="Common.Label.Category"
                                        defaultMessage="Category"
                                    />
                                </FormFieldLabel>

                                <Category>
                                    {game ? (
                                        <CategoryFigure>
                                            <img
                                                src={game.boxArtUrl
                                                    .replace("{width}", "138")
                                                    .replace("{height}", "190")}
                                                alt={game.name}
                                            />
                                        </CategoryFigure>
                                    ) : (
                                        ""
                                    )}
                                    <span>{game.name}</span>
                                </Category>

                                <AsyncSelect
                                    styles={gameStyle}
                                    cacheOptions={true}
                                    defaultValue={defaultGameOption}
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
                            </FormField>

                            <FormField>
                                <FormFieldLabel htmlFor="language">
                                    <FormattedMessage
                                        id="Common.Label.Language"
                                        defaultMessage="Language"
                                    />
                                </FormFieldLabel>

                                <Select
                                    styles={languageStyle}
                                    name="language"
                                    id="language"
                                    defaultValue={defaultLanguageOption}
                                    options={languageList}
                                    onChange={(e) => updateLanguage(e.value)}
                                    placeholder={intl.formatMessage({
                                        id: "Common.Select.Placeholder",
                                        defaultMessage: "Select...",
                                    })}
                                />
                            </FormField>

                            <FormField>
                                <FormFieldLabel htmlFor="tags">
                                    <FormattedMessage
                                        id="Common.Label.Tags"
                                        defaultMessage="Tags"
                                    />
                                </FormFieldLabel>

                                <Alert color="warning">
                                    <FormattedMessage
                                        id="Page.Channel.Information.TagNotice"
                                        defaultMessage="Tags are not editable for now"
                                    />
                                </Alert>

                                <Select
                                    styles={tagStyle}
                                    isMulti
                                    isDisabled
                                    options={tagOption}
                                    defaultValue={tags}
                                    getOptionLabel={(option) => option.name}
                                    getOptionValue={(option) => option.id}
                                    // loadOptions={loadTagOptions}
                                    placeholder={intl.formatMessage({
                                        id: "Common.Select.Placeholder",
                                        defaultMessage: "Select...",
                                    })}
                                />
                            </FormField>

                            <FormFieldAction>
                                <Button
                                    type="button"
                                    onClick={onClickSaveTemplateHandler}
                                >
                                    <FormattedMessage
                                        id="Page.Channel.Information.SaveTemplate"
                                        defaultMessage="Save to Template"
                                    />
                                </Button>

                                <Button type="submit" color="primary">
                                    <FormattedMessage
                                        id="Common.Submit"
                                        defaultMessage="Submit"
                                    />
                                </Button>
                            </FormFieldAction>
                        </form>
                    )}
                </Section>

                <Section>
                    <SectionHeader>
                        <FormattedMessage
                            id="Page.Channel.Template.Header"
                            defaultMessage="Channel Template"
                        />
                    </SectionHeader>

                    <TableResponsive>
                        <Table cols={[null, null, null, 140, 100]}>
                            <TableThead>
                                <TableRow>
                                    <TableHead scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Title"
                                            defaultMessage="Title"
                                        />
                                    </TableHead>
                                    <TableHead scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Category"
                                            defaultMessage="Category"
                                        />
                                    </TableHead>
                                    <TableHead scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Language"
                                            defaultMessage="Language"
                                        />
                                    </TableHead>
                                    <TableHead scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Created"
                                            defaultMessage="Created"
                                        />
                                    </TableHead>
                                    <TableHead scope="col" />
                                </TableRow>
                            </TableThead>
                            <TableTbody>
                                {channelTemplates.map((channelTemplate) => (
                                    <ChannelTemplateRow
                                        key={channelTemplate._id}
                                        channelTemplate={channelTemplate}
                                    />
                                ))}
                            </TableTbody>
                        </Table>
                    </TableResponsive>
                </Section>
            </Container>
        </>
    );
};

export default ChannelPage;
