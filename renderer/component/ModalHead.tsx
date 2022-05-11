import React from "react";
import tw from "twin.macro";
import styled from "@emotion/styled";

const ModalHeadComponent = tw.div`font-bold p-3 border-b border-solid border-gray-300 dark:border-gray-500 flex justify-between`;
const ModalHeadClose = styled.button([
    tw`w-6 h-6 relative`,
    {
        [`&::before, &::after`]: [
            { content: `''`, height: 2 },
            tw`block absolute w-5 m-auto inset-0 bg-gray-800 dark:bg-white`,
        ],
        [`&::before`]: { transform: "rotate(-45deg)" },
        [`&::after`]: { transform: "rotate(45deg)" },
    },
]);

type Props = {
    onClose?: () => void;
};

const ModalHead: React.FunctionComponent<Props> = ({ children, onClose }) => {
    return (
        <ModalHeadComponent>
            {children}

            {onClose ? (
                <ModalHeadClose
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                />
            ) : null}
        </ModalHeadComponent>
    );
};

export default ModalHead;
