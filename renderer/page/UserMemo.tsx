import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import UserMemoState from "../atom/UserMemo";
import LocaleState from "../atom/Locale";

// Component
import Meta from "../component/Meta";
import UserMemoRow from "../component/UserMemoRow";
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

const UserMemoPage: React.FC = () => {
    const [userMemos, updateUserMemos] = useRecoilState(UserMemoState);
    const locale = useRecoilValue(LocaleState);

    useEffect(() => {
        (async () => {
            const memos = await request("usermemo", null, [
                {
                    _id: "1",
                    username: "username",
                    nickname: "nickname",
                    memo: "memo",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    username: "username",
                    nickname: "nickname",
                    memo: "memo",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);

            updateUserMemos(memos);
        })();
    }, []);

    return (
        <>
            <Meta id="Common.UserMemo.Name" defaultMessage="User memo" />

            <PageHeader icon="people">
                <FormattedMessage
                    id="Common.UserMemo.Name"
                    defaultMessage="User memo"
                />
            </PageHeader>

            <Container>
                <Section>
                    <SectionLead>
                        <FormattedMessage
                            id="Common.UserMemo.Description"
                            defaultMessage="You can store the target additional information."
                        />
                    </SectionLead>

                    <TableResponsive>
                        <Table
                            cols={[null, 140, locale === "ja-jp" ? 180 : 160]}
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
                                            id="Common.Label.Created"
                                            defaultMessage="Created"
                                        />
                                    </TableHead>
                                    <TableHead scope="col" />
                                </TableRow>
                            </TableThead>
                            <TableTbody>
                                {userMemos.map((usermemo) => {
                                    return (
                                        <UserMemoRow
                                            usermemo={usermemo}
                                            key={usermemo._id}
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

export default UserMemoPage;
