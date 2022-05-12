import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import styled from "@emotion/styled";

// Recoil
import CommandsState from "../atom/Commands";

// Component
import Meta from "../component/Meta";
import CommandRow from "../component/CommandRow";
import CommandForm from "../component/CommandForm";
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
const CommandFormWrap = styled.div({ marginBottom: 10 });

// Util
import { request } from "../util/request";

const CommandPage: React.FC = () => {
    const [commands, updateCommands] = useRecoilState(CommandsState);

    useEffect(() => {
        (async () => {
            const commands = await request("command", {}, [
                {
                    _id: "1",
                    command: "Command1",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "broadcaster",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    command: "Command2",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "mod",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "3",
                    command: "Command3",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "vip",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "4",
                    command: "Command4",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "everyone",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);

            updateCommands([...commands]);
        })();
    }, []);

    return (
        <>
            <Meta id="Common.Command.Name" defaultMessage="Command" />

            <PageHeader icon="wrench">
                <FormattedMessage
                    id="Common.Command.Name"
                    defaultMessage="Command"
                />
            </PageHeader>

            <Container>
                <Section>
                    <SectionLead>
                        <FormattedMessage
                            id="Common.Command.Description"
                            defaultMessage="You can manage your own channel command."
                        />
                    </SectionLead>

                    <CommandFormWrap>
                        <CommandForm />
                    </CommandFormWrap>
                </Section>

                <TableResponsive>
                    <Table cols={[null, 140, 140, 80]}>
                        <TableThead>
                            <TableRow>
                                <TableHead scope="col">
                                    <FormattedMessage
                                        id="Common.Label.Command"
                                        defaultMessage="Command"
                                    />
                                </TableHead>
                                <TableHead scope="col">
                                    <FormattedMessage
                                        id="Common.Label.Priviledge"
                                        defaultMessage="Priviledge"
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
                            {commands.map((command) => {
                                return (
                                    <CommandRow
                                        command={command}
                                        key={command._id}
                                    />
                                );
                            })}
                        </TableTbody>
                    </Table>
                </TableResponsive>
            </Container>
        </>
    );
};

export default CommandPage;
