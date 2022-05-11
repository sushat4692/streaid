import React from "react";
import { ClassNames } from "@emotion/react";
import tw from "twin.macro";

import Icon from "./Icon";

type Props = {
    icon: string;
    only?: boolean;
};

const ButtonIcon: React.FunctionComponent<Props> = ({ icon, only }) => {
    return (
        <ClassNames>
            {({ css }) => (
                <Icon
                    icon={icon}
                    className={css(only ? null : tw`mr-1`)}
                ></Icon>
            )}
        </ClassNames>
    );
};

export default ButtonIcon;
