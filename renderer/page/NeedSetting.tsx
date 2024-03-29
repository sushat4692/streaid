import React from "react";
import { FormattedMessage } from "react-intl";
import tw from "twin.macro";

// Component
import MetaComponent from "../component/Meta";
import Container from "../../component/Container";
import Section from "../../component/Section";
import ButtonLink from "../../component/ButtonLink";
import DashboardHeadline from "../component/DashboardHeadline";

const Need = tw.div`text-center`;
const NeedLead = tw.div`text-lg mb-4`;

export const NeedSettingPage: React.FC = () => {
    return (
        <>
            <MetaComponent />

            <DashboardHeadline secondary="Aiding your streaming">
                <FormattedMessage id="Common.Title" defaultMessage="Streaid" />
            </DashboardHeadline>

            <Container>
                <Section>
                    <Need>
                        <NeedLead>
                            <FormattedMessage
                                id="Page.NeedSetting.Lead"
                                defaultMessage="Please update application setting first."
                            />
                        </NeedLead>

                        <ButtonLink to="/settings" size="large" color="primary">
                            Settings
                        </ButtonLink>
                    </Need>
                </Section>
            </Container>
        </>
    );
};

export default NeedSettingPage;
