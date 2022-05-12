import React from "react";
import tw from "twin.macro";
import { ClassNames } from "@emotion/react";
import Modal from "react-modal";

type Props = {
    isOpen: boolean;
};

const ModalComponent: React.FunctionComponent<Props> = ({
    children,
    isOpen,
}) => {
    return (
        <ClassNames>
            {({ css }) => (
                <Modal
                    isOpen={isOpen}
                    className={css(
                        tw`max-w-md mx-auto bg-white dark:bg-gray-800 rounded`
                    )}
                    overlayClassName={css(
                        tw`fixed inset-0 p-4 z-40 bg-black bg-opacity-50 overflow-auto`
                    )}
                >
                    {children}
                </Modal>
            )}
        </ClassNames>
    );
};

export default ModalComponent;
