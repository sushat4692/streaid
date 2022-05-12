import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import styled from "@emotion/styled";
import tw from "twin.macro";

// Utils
import { requestEvent } from "../util/request";
import { useSettingState } from "../util/setting";

// Component
import ConnectComponent from "./Connect";
import Container from "../../component/Container";
const Nav = tw.header`bg-gray-800 dark:bg-gray-900 fixed w-full z-30`;
const NavInner = tw.div`flex items-center justify-between h-16 md:h-10`;
const NavList = tw.div`flex items-center`;
const NavListMenu = tw.div`hidden md:block`;
const NavListMenuInner = tw.div`flex items-baseline`;
const NavListMenuButton = styled(NavLink)<{ disabled?: boolean }>(
    ({ disabled }) => [
        tw`text-gray-300 hover:bg-gray-700 hover:text-white px-3 text-sm font-medium flex items-center h-10`,
        disabled ? { opacity: 0.6, pointerEvents: "none" } : null,
        { [`&.active`]: tw`bg-gray-700` },
    ]
);
const NavSide = tw.div`hidden md:block`;
const NavSideInner = styled.div([
    tw`ml-4 flex items-center`,
    { [`${NavListMenuButton}`]: tw`md:mr-2` },
]);
const NavBurger = tw.div`-mr-2 flex md:hidden`;
const NavBurgerButton = tw.button`bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white`;
const NavBurgerButtonLabel = tw.span`sr-only`;
const NavBurgerButtonIcon = styled.svg<{ visible: boolean }>(({ visible }) => [
    tw`h-6 w-6 hidden`,
    visible ? tw`block` : null,
]);
const NavMobile = styled.div<{ visible: boolean }>(({ visible }) => [
    tw`hidden md:hidden!`,
    visible ? tw`block` : null,
]);
const NavMobileMenu = tw.div`px-2 pt-2 pb-3 space-y-1 sm:px-3`;
const NavMobileMenuButton = styled(NavLink)<{ disabled: boolean }>(
    ({ disabled }) => [
        tw`text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium`,
        disabled ? { opacity: 0.6, pointerEvents: "none" } : null,
        { [`&.active`]: tw`bg-gray-700` },
    ]
);

const HeaderComponent: React.FC = () => {
    const [isSPNavView, updateIsSPNavView] = useState(false);
    const setting = useSettingState();
    const navigate = useNavigate();

    useEffect(() => {
        requestEvent("linkto", (_, values) => {
            navigate(values);
        });
    }, []);

    return (
        <Nav>
            <Container>
                <NavInner>
                    <NavList>
                        <NavListMenu>
                            <NavListMenuInner>
                                <NavListMenuButton end to="/">
                                    <FormattedMessage
                                        id="Common.Dashboard.Name"
                                        defaultMessage="Dashboard"
                                    />
                                </NavListMenuButton>
                                <NavListMenuButton
                                    end
                                    disabled={!setting.isEnableBot}
                                    to="chatters"
                                >
                                    <FormattedMessage
                                        id="Common.Chatters.Name"
                                        defaultMessage="Chatters"
                                    />
                                </NavListMenuButton>
                                <NavListMenuButton
                                    end
                                    disabled={!setting.isEnableBot}
                                    to="/raiders"
                                >
                                    <FormattedMessage
                                        id="Common.Raiders.Name"
                                        defaultMessage="Raiders"
                                    />
                                </NavListMenuButton>
                                <NavListMenuButton
                                    end
                                    disabled={!setting.isEnableBot}
                                    to="/hosts"
                                >
                                    <FormattedMessage
                                        id="Common.Hosts.Name"
                                        defaultMessage="Hosts"
                                    />
                                </NavListMenuButton>
                                <NavListMenuButton
                                    end
                                    disabled={!setting.isEnableChannel}
                                    to="/channel"
                                >
                                    <FormattedMessage
                                        id="Common.Channel.Name"
                                        defaultMessage="Channel"
                                    />
                                </NavListMenuButton>
                                <NavListMenuButton
                                    end
                                    disabled={!setting.isEnableBot}
                                    to="/user_memo"
                                >
                                    <FormattedMessage
                                        id="Common.UserMemo.Name"
                                        defaultMessage="User memo"
                                    />
                                </NavListMenuButton>
                                <NavListMenuButton
                                    end
                                    disabled={!setting.isEnableBot}
                                    to="/commands"
                                >
                                    <FormattedMessage
                                        id="Common.Command.Name"
                                        defaultMessage="Command"
                                    />
                                </NavListMenuButton>
                            </NavListMenuInner>
                        </NavListMenu>
                    </NavList>

                    <NavSide>
                        <NavSideInner>
                            <NavListMenuButton to="/settings">
                                <FormattedMessage
                                    id="Common.Settings.Name"
                                    defaultMessage="Settings"
                                />
                            </NavListMenuButton>

                            <ConnectComponent />
                        </NavSideInner>
                    </NavSide>

                    <NavBurger>
                        <NavBurgerButton
                            type="button"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                            onClick={() => {
                                updateIsSPNavView(!isSPNavView);
                            }}
                        >
                            <NavBurgerButtonLabel>
                                Open main menu
                            </NavBurgerButtonLabel>

                            <NavBurgerButtonIcon
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                                visible={!isSPNavView}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </NavBurgerButtonIcon>

                            <NavBurgerButtonIcon
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                                visible={isSPNavView}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </NavBurgerButtonIcon>
                        </NavBurgerButton>
                    </NavBurger>
                </NavInner>
            </Container>

            <NavMobile visible={isSPNavView}>
                <NavMobileMenu>
                    <NavMobileMenuButton disabled={false} to="/">
                        <FormattedMessage
                            id="Common.Dashboard.Name"
                            defaultMessage="Dashboard"
                        />
                    </NavMobileMenuButton>
                    <NavMobileMenuButton
                        disabled={!setting.isEnableBot}
                        to="chatters"
                    >
                        <FormattedMessage
                            id="Common.Chatters.Name"
                            defaultMessage="Chatters"
                        />
                    </NavMobileMenuButton>
                    <NavMobileMenuButton
                        disabled={!setting.isEnableBot}
                        to="/raiders"
                    >
                        <FormattedMessage
                            id="Common.Raiders.Name"
                            defaultMessage="Raiders"
                        />
                    </NavMobileMenuButton>
                    <NavMobileMenuButton
                        disabled={!setting.isEnableBot}
                        to="/hosts"
                    >
                        <FormattedMessage
                            id="Common.Hosts.Name"
                            defaultMessage="Hosts"
                        />
                    </NavMobileMenuButton>
                    <NavMobileMenuButton
                        disabled={!setting.isEnableChannel}
                        to="/channel"
                    >
                        <FormattedMessage
                            id="Common.Channel.Name"
                            defaultMessage="Channel"
                        />
                    </NavMobileMenuButton>
                    <NavMobileMenuButton
                        disabled={!setting.isEnableBot}
                        to="/user_memo"
                    >
                        <FormattedMessage
                            id="Common.UserMemo.Name"
                            defaultMessage="User memo"
                        />
                    </NavMobileMenuButton>
                    <NavMobileMenuButton
                        disabled={!setting.isEnableBot}
                        to="/commands"
                    >
                        <FormattedMessage
                            id="Common.Commmand.Name"
                            defaultMessage="Command"
                        />
                    </NavMobileMenuButton>
                    <ConnectComponent isBlock={true} />
                </NavMobileMenu>
            </NavMobile>
        </Nav>
    );
};

export default HeaderComponent;
