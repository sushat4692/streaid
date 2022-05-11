import React from "react";
import styled from "@emotion/styled";
import tw from "twin.macro";

import Container from "./Container";
import Icon from "./Icon";

const PageHeader = tw.div`mb-3 py-2 border-b border-solid border-gray-300 dark:border-gray-500`;
const PageHeaderIcon = styled(Icon)(tw`mr-2 font-black`);
const PageHeaderAction = tw.div`flex items-center justify-between`;
const PageHeaderText = tw.div`font-extrabold flex items-center`;

type Props = {
    icon?: string;
    action?: React.ReactNode;
};

const PageHeaderComponent: React.FC<Props> = ({ children, icon, action }) => {
    return (
        <PageHeader>
            <Container>
                <PageHeaderAction>
                    <PageHeaderText>
                        {icon ? <PageHeaderIcon icon={icon} /> : null}
                        {children}
                    </PageHeaderText>

                    {action ? action : null}
                </PageHeaderAction>
            </Container>
        </PageHeader>
    );
};

export default PageHeaderComponent;
