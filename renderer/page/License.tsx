/* eslint-disable react/no-unescaped-entities */
import React, { useRef } from "react";
import { FormattedMessage } from "react-intl";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Component
import Meta from "../component/Meta";
import PageHeader from "../../component/PageHeader";
import Container from "../../component/Container";
import Section from "../../component/Section";
import SectionHeader from "../../component/SectionHeader";
import SectionDesc from "../../component/SectionDesc";
const List = tw.ul``;
const ListItem = styled.li([
    tw`break-words`,
    {
        [`& + &`]: tw`mt-2 pt-2 border-t border-dotted border-gray-300 dark:border-gray-500`,
    },
]);
const ListSmall = tw.small`text-sm opacity-70`;

// Const
import licenses from "../const/licenses";

const LicensePage: React.FC = () => {
    const displayLicenses = useRef(
        licenses.filter((license) => {
            return !license.name.match(/^@types\//);
        })
    );

    return (
        <>
            <Meta id="Common.License.Name" defaultMessage="License" />

            <PageHeader icon="book">
                <FormattedMessage
                    id="Common.License.Name"
                    defaultMessage="License"
                />
            </PageHeader>

            <Container>
                <Section>
                    <SectionHeader>MIT License</SectionHeader>

                    <SectionDesc>
                        Copyright (c) 2021 SUSH (Satoshi Ukai)
                    </SectionDesc>

                    <SectionDesc>
                        <FormattedMessage
                            id="Page.License.MIT1"
                            defaultMessage='Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:'
                        />
                    </SectionDesc>

                    <SectionDesc>
                        <FormattedMessage
                            id="Page.License.MIT2"
                            defaultMessage="The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."
                        />
                    </SectionDesc>

                    <SectionDesc>
                        <FormattedMessage
                            id="Page.License.MIT3"
                            defaultMessage='THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'
                        />
                    </SectionDesc>
                </Section>

                <Section>
                    <SectionHeader>
                        <FormattedMessage
                            id="Page.License.ThankYou"
                            defaultMessage="Thank you for developers of dependency libraries"
                        />
                    </SectionHeader>

                    <List>
                        {displayLicenses.current.map((license) => {
                            return (
                                <ListItem key={license.name}>
                                    {license.name} ({license.licenseType})
                                    {license.author
                                        ? ` by ${license.author}`
                                        : ""}
                                    <br />
                                    <ListSmall>{license.link}</ListSmall>
                                </ListItem>
                            );
                        })}
                        <ListItem>
                            English-Japanese Dictionary "ejdict-hand" (Public
                            Domain CC0) by kujirahand
                            <br />
                            <ListSmall>
                                https://github.com/kujirahand/EJDict
                            </ListSmall>
                        </ListItem>
                        <ListItem>
                            English-Dictionary-SQLite (MIT) by AyeshJayasekara
                            <br />
                            <ListSmall>
                                https://github.com/AyeshJayasekara/English-Dictionary-SQLite
                            </ListSmall>
                        </ListItem>
                    </List>
                </Section>
            </Container>
        </>
    );
};

export default LicensePage;
