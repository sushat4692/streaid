import React from "react";
import { FormattedMessage } from "react-intl";
import { NavLink, Routes, Route } from "react-router-dom";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Component
import Meta from "../component/Meta";
import SettingLocale from "../component/SettingLocale";
import SettingBot from "../component/SettingBot";
import SettingShoutOutMessage from "../component/SettingShoutOutMessage";
import SettingShoutoutAlert from "../component/SettingShoutoutAlert";
import SettingSound from "../component/SettingSound";
import SettingTranslate from "../component/SettingTranslate";
import PageHeader from "../../component/PageHeader";
import Container from "../../component/Container";
const Wrapper = tw.div`md:flex md:items-start`;
const Nav = tw.nav`text-sm pb-4 mb-4 border-b border-solid border-gray-300 dark:border-gray-500 md:border-0 md:mb-0 md:w-48 md:sticky md:top-10 md:flex-shrink-0`;
const Main = tw.main`md:flex-grow`;
const NavItem = styled(NavLink)(() => [
    tw`block py-2 px-4 bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10`,
    { [`&.active`]: tw`bg-opacity-10` },
]);

const SettnigPage: React.FC = () => {
    return (
        <>
            <Meta id="Common.Settings.Name" defaultMessage="Settings" />

            <PageHeader icon="gear">
                <FormattedMessage
                    id="Common.Settings.Name"
                    defaultMessage="Settings"
                />
            </PageHeader>

            <Wrapper>
                <Nav>
                    <NavItem end to={`.`}>
                        <FormattedMessage
                            id="Component.Setting.General"
                            defaultMessage="General"
                        />
                    </NavItem>
                    <NavItem end to={`/settings/shoutout`}>
                        <FormattedMessage
                            id="Component.SettingShoutOutMessage.Header"
                            defaultMessage="Shoutout Message"
                        />
                    </NavItem>
                    <NavItem end to={`/settings/shoutout_alert`}>
                        <FormattedMessage
                            id="Component.SettingShoutOutAlert.Header"
                            defaultMessage="Shoutout Alert"
                        />
                    </NavItem>
                    <NavItem end to={`/settings/sound`}>
                        <FormattedMessage
                            id="Component.SettingSound.Header"
                            defaultMessage="Notification Sound"
                        />
                    </NavItem>
                    <NavItem end to={`/settings/translate`}>
                        <FormattedMessage
                            id="Component.SettingTranslate.Header"
                            defaultMessage="Translate"
                        />
                    </NavItem>
                </Nav>

                <Main>
                    <Container>
                        <Routes>
                            <Route
                                path={`shoutout`}
                                element={<SettingShoutOutMessage />}
                            ></Route>
                            <Route
                                path={`shoutout_alert`}
                                element={<SettingShoutoutAlert />}
                            ></Route>
                            <Route
                                path={`sound`}
                                element={<SettingSound />}
                            ></Route>
                            <Route
                                path={`translate`}
                                element={<SettingTranslate />}
                            ></Route>
                            <Route
                                path={`/`}
                                element={
                                    <>
                                        <SettingLocale></SettingLocale>
                                        <SettingBot></SettingBot>
                                    </>
                                }
                            ></Route>
                        </Routes>
                    </Container>
                </Main>
            </Wrapper>
        </>
    );
};

export default SettnigPage;
