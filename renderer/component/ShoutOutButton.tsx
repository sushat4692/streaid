import React, { useCallback, useState } from "react";
import { useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Recoil
import IsConnectingState from "../atom/IsConnecting";

// Util
import { request } from "../util/request";

// Component
import Button from "../../component/Button";
import ButtonIcon from "../../component/ButtonIcon";

type Props = {
    username: string;
    size?: "small" | "large";
    block?: boolean;
    disabled?: boolean;
    color?: "primary" | "danger";
};

const Wrap = styled.div([
    tw`flex relative`,
    {
        marginLeft: 1,
        marginRight: 1,
        [`& button`]: tw`rounded-none!`,
    },
]);
const Nav = styled.div<{ isShowNav: boolean }>(({ isShowNav }) => [
    tw`absolute top-full right-0 z-10 bg-gray-100 dark:bg-gray-900 whitespace-nowrap mt-1 rounded-sm shadow`,
    !isShowNav ? tw`hidden` : null,
]);
const NavItem = styled.button([
    tw`block px-4 py-2 hover:bg-gray-500 hover:bg-opacity-50`,
    {
        [`& + &`]: tw`border-t border-solid border-gray-300 dark:border-gray-500`,
    },
]);

const ShoutOutButtonComponent: React.FC<Props> = ({
    username,
    size,
    block,
    disabled,
    color,
}: Props) => {
    const [isShowNav, updateIsShowNav] = useState(false);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const clickHandler = useCallback(
        (showWindow: string | null = null) => {
            return async () => {
                updateIsConnecting(true);

                await request("bot:shoutout", { username, showWindow }, null);

                updateIsConnecting(false);
                updateIsShowNav(false);
            };
        },
        [username]
    );

    const toggleNavHandler = useCallback(() => {
        updateIsShowNav((prev) => !prev);
    }, []);

    return (
        <>
            <Button
                size={size}
                block={block}
                disabled={disabled}
                color={color}
                onClick={clickHandler()}
            >
                <ButtonIcon icon="speaker" />
                <FormattedMessage
                    id="Common.Label.ShoutOut"
                    defaultMessage="ShoutOut"
                />
            </Button>
            <Wrap>
                <Button
                    size={size}
                    block={block}
                    disabled={disabled}
                    color={color}
                    onClick={toggleNavHandler}
                >
                    <ButtonIcon icon="caret-down-fill" only />
                </Button>

                <Nav isShowNav={isShowNav}>
                    <NavItem onClick={clickHandler("info")}>Show Info</NavItem>
                    <NavItem onClick={clickHandler("clip")}>Show Clip</NavItem>
                </Nav>
            </Wrap>
        </>
    );
};

export default ShoutOutButtonComponent;
