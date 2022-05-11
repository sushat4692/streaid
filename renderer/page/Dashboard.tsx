import React from "react";
import { FormattedMessage } from "react-intl";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Util
import { useSettingState } from "../util/setting";

// Component
import MetaComponent from "../component/Meta";
import Container from "../../component/Container";
import Icon from "../../component/Icon";
import Section from "../../component/Section";
import ButtonLink from "../../component/ButtonLink";
import DashboardHeadline from "../component/DashboardHeadline";
import DashboardHeadlineIcon from "../component/DashboardHeadlineIcon";

const Cards = styled.div([
    { gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))` },
    tw`grid grid-cols-1 md:grid-cols-3 gap-2`,
]);
const CardsItem = tw.div`relative border border-solid border-gray-300 dark:border-gray-500 rounded p-3`;
const CardsHead = tw.h2`font-bold mb-1`;
const CardsHeadIcon = styled(Icon)([tw`mr-2`]);
const CardsText = tw.p`mb-2`;

const DashboardPage: React.FC = () => {
    const setting = useSettingState();

    return (
        <>
            <MetaComponent />

            <DashboardHeadline>
                <DashboardHeadlineIcon icon={`twitch`} />
                <FormattedMessage
                    id="Common.Title"
                    defaultMessage="Twitch Support Tool"
                />
            </DashboardHeadline>

            <Container>
                <Section>
                    <Cards>
                        <CardsItem>
                            <CardsHead>
                                <CardsHeadIcon icon={`chat`} />
                                <FormattedMessage
                                    id="Common.Chatters.Name"
                                    defaultMessage="Chatters"
                                />
                            </CardsHead>
                            <CardsText>
                                <FormattedMessage
                                    id="Common.Chatters.Description"
                                    defaultMessage="Display user list that comment to target channel."
                                />
                            </CardsText>
                            <ButtonLink
                                to="/chatters"
                                color="primary"
                                stretched={setting.isEnableBot}
                                disabled={!setting.isEnableBot}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </ButtonLink>
                        </CardsItem>

                        <CardsItem>
                            <CardsHead>
                                <CardsHeadIcon icon={`tornado`} />
                                <FormattedMessage
                                    id="Common.Raiders.Name"
                                    defaultMessage="Raiders"
                                />
                            </CardsHead>
                            <CardsText>
                                <FormattedMessage
                                    id="Common.Raiders.Description"
                                    defaultMessage="Display user list that raided to target channel."
                                />
                            </CardsText>
                            <ButtonLink
                                to="/raiders"
                                color="primary"
                                stretched={setting.isEnableBot}
                                disabled={!setting.isEnableBot}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </ButtonLink>
                        </CardsItem>

                        <CardsItem>
                            <CardsHead>
                                <CardsHeadIcon icon={`display`} />
                                <FormattedMessage
                                    id="Common.Hosts.Name"
                                    defaultMessage="Hosts"
                                />
                            </CardsHead>
                            <CardsText>
                                <FormattedMessage
                                    id="Common.Hosts.Description"
                                    defaultMessage="Display user list that hosted to target channel."
                                />
                            </CardsText>
                            <ButtonLink
                                to="/hosts"
                                color="primary"
                                stretched={setting.isEnableBot}
                                disabled={!setting.isEnableBot}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </ButtonLink>
                        </CardsItem>

                        <CardsItem>
                            <CardsHead>
                                <CardsHeadIcon icon={`camera-reels`} />
                                <FormattedMessage
                                    id="Common.Channel.Name"
                                    defaultMessage="Channel"
                                />
                            </CardsHead>
                            <CardsText>
                                <FormattedMessage
                                    id="Common.Channel.Description"
                                    defaultMessage="You can check/update Channel information."
                                />
                            </CardsText>
                            <ButtonLink
                                to="/channel"
                                color="primary"
                                stretched={setting.isEnableChannel}
                                disabled={!setting.isEnableChannel}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </ButtonLink>
                        </CardsItem>

                        <CardsItem>
                            <CardsHead>
                                <CardsHeadIcon icon={`people`} />
                                <FormattedMessage
                                    id="Common.UserMemo.Name"
                                    defaultMessage="Channel"
                                />
                            </CardsHead>
                            <CardsText>
                                <FormattedMessage
                                    id="Common.UserMemo.Description"
                                    defaultMessage="You can store the target additional information."
                                />
                            </CardsText>
                            <ButtonLink
                                to="/user_memo"
                                color="primary"
                                stretched={setting.isEnableBot}
                                disabled={!setting.isEnableBot}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </ButtonLink>
                        </CardsItem>

                        <CardsItem>
                            <CardsHead>
                                <CardsHeadIcon icon={`wrench`} />
                                <FormattedMessage
                                    id="Common.Command.Name"
                                    defaultMessage="Command"
                                />
                            </CardsHead>
                            <CardsText>
                                <FormattedMessage
                                    id="Common.Command.Description"
                                    defaultMessage="You can manage your own channel command."
                                />
                            </CardsText>
                            <ButtonLink
                                to="/commands"
                                color="primary"
                                stretched={setting.isEnableBot}
                                disabled={!setting.isEnableBot}
                            >
                                <FormattedMessage
                                    id="View.Dashboard.CheckButton"
                                    defaultMessage="Check"
                                />
                            </ButtonLink>
                        </CardsItem>
                    </Cards>
                </Section>
            </Container>
        </>
    );
};

export default DashboardPage;
