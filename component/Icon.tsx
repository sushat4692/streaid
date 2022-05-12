import React from "react";
import styled from "@emotion/styled";

// Props
type Props = {
    icon: string;
    className?: string;
};

const IconComponent = styled.i();

const Icon: React.FunctionComponent<Props> = ({ icon, className }) => {
    return <IconComponent className={`bi bi-${icon} ${className}`} />;
};

export default Icon;
