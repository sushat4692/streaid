import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import HostsState from "../atom/Hosts";

// Component
import MetaComponent from "../component/Meta";
import HostRow from "../component/HostRow";
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
    const [hosts, updateHosts] = useRecoilState(HostsState);

    useEffect(() => {
        (async () => {
            const hosts = await request("host", null, [
                {
                    _id: "1",
                    channel: "channel",
                    username: "channel",
                    viewers: 1,
                    autohost: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    channel: "channel",
                    username: "channel",
                    viewers: 1,
                    autohost: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
            updateHosts([...hosts]);
        })();
    }, []);

    return (
        <>
            <MetaComponent id="Common.Hosts.Name" defaultMessage="Hosts" />

            <PageHeader icon="display">
                <FormattedMessage
                    id="Common.Hosts.Name"
                    defaultMessage="Hosts"
                />
            </PageHeader>

            <Container>
                <Section>
                    <SectionLead>
                        <FormattedMessage
                            id="Common.Hosts.Description"
                            defaultMessage="Display user list that hosted to target channel."
                        />
                    </SectionLead>

                    <TableResponsive>
                        <Table cols={[null, 100, 100, 140, 30]}>
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
                                            id="Common.Label.Viewers"
                                            defaultMessage="Viewers"
                                        />
                                    </TableHead>
                                    <TableHead scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Autoloaded"
                                            defaultMessage="Autoloaded"
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
                                {hosts.map((host) => {
                                    return (
                                        <HostRow host={host} key={host._id} />
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
