import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import ChattersState from "../atom/Chatters";
import LocaleState from "../atom/Locale";

// Component
import MetaComponent from "../component/Meta";
import ChatterRow from "../component/ChatterRow";
import Container from "../../component/Container";
import Section from "../../component/Section";
import SectionLead from "../../component/SectionLead";
import PageHeader from "../../component/PageHeader";
import TableResponsive from "../component/TableResponsive";
import Table from "../component/Table";
import TableThead from "../component/TableThead";
import TableRow from "../component/TableRow";
import TableHead from "../component/TableHead";
import TableTbody from "../component/TableTbody";

// Util
import { request } from "../util/request";

const ChattersPage: React.FC = () => {
    const [chatters, updateChatters] = useRecoilState(ChattersState);
    const locale = useRecoilValue(LocaleState);

    useEffect(() => {
        (async () => {
            const chatters = await request("chatter", null, [
                {
                    _id: "1",
                    "message-type": "chat",
                    username: "username",
                    "display-name": "displayname",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    "message-type": "chat",
                    username: "username",
                    "display-name": "displayname",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
            updateChatters([...chatters]);
        })();
    }, []);

    return (
        <>
            <MetaComponent
                id="Common.Chatters.Name"
                defaultMessage="Chatters"
            />

            <PageHeader icon="chat">
                <FormattedMessage
                    id="Common.Chatters.Name"
                    defaultMessage="Chatters"
                />
            </PageHeader>

            <Container>
                <Section>
                    <SectionLead>
                        <FormattedMessage
                            id="Common.Chatters.Description"
                            defaultMessage="Display user list that comment to target channel."
                        />
                    </SectionLead>

                    <TableResponsive>
                        <Table
                            cols={[
                                null,
                                null,
                                140,
                                locale === "ja-jp" ? 180 : 160,
                            ]}
                        >
                            <TableThead>
                                <TableRow>
                                    <TableHead scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Username"
                                            defaultMessage="Username"
                                        />
                                        /
                                        <FormattedMessage
                                            id="Common.Label.NickName"
                                            defaultMessage="Nick name"
                                        />
                                    </TableHead>
                                    <TableHead scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Displayname"
                                            defaultMessage="Displayname"
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
                                {chatters.map((chatter) => {
                                    return (
                                        <ChatterRow
                                            chatter={chatter}
                                            key={chatter._id}
                                        />
                                    );
                                })}
                            </TableTbody>
                        </Table>
                    </TableResponsive>
                </Section>
            </Container>
        </>
    );
};

export default ChattersPage;
