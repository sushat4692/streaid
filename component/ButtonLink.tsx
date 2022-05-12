import React from "react";
import { useNavigate } from "react-router-dom";

import Button from "./Button";

type Props = {
    size?: "small" | "large";
    block?: boolean;
    disabled?: boolean;
    stretched?: boolean;
    color?: "primary" | "danger";
    to: string;
};

const ButtonLink: React.FC<Props> = ({ children, to, ...props }) => {
    const navigate = useNavigate();
    const onClickHandler = () => {
        navigate(to);
    };

    return (
        <Button {...props} onClick={onClickHandler}>
            {children}
        </Button>
    );
};

export default ButtonLink;
