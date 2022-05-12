import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import RaidersState from "../atom/Raiders";
import LocaleState from "../atom/Locale";

// Component
import MetaComponent from "../component/Meta";
import RaiderRow from "../component/RaiderRow";
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
    const [raiders, updateRaiders] = useRecoilState(RaidersState);
    const locale = useRecoilValue(LocaleState);

    useEffect(() => {
        (async () => {
            const raiders = await request("raider", null, [
                {
                    _id: "1",
                    channel: "channel",
                    username: "username",
                    displayname: "username",
                    viewers: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    channel: "channel",
                    username: "username",
                    displayname: "username",
                    viewers: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
            updateRaiders([...raiders]);
        })();
    }, []);

    return (
        <>
            <MetaComponent id="Common.Raiders.Name" defaultMessage="Raiders" />

            <PageHeader icon="tornado">
                <FormattedMessage
                    id="Common.Raiders.Name"
                    defaultMessage="Raiders"
                />
            </PageHeader>

            <Container>
                <Section>
                    <SectionLead>
                        <FormattedMessage
                            id="Common.Raiders.Description"
                            defaultMessage="Display user list that raided to target channel."
                        />
                    </SectionLead>

                    <TableResponsive>
                        <Table
                            cols={[
                                null,
                                null,
                                100,
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
                                            id="Common.Label.Viewers"
                                            defaultMessage="Viewers"
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
                                {raiders.map((raider) => {
                                    return (
                                        <RaiderRow
                                            raider={raider}
                                            key={raider._id}
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
