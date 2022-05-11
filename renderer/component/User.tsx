import React, { useCallback, useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import ReactTooltip from "react-tooltip";
import tw from "twin.macro";

// Recoil
import UserMemoState from "../atom/UserMemo";

// Util
import { request } from "../util/request";

// Components
import Modal from "./Modal";
import ModalHead from "./ModalHead";
import ModalBody from "./ModalBody";
import ModalFoot from "./ModalFoot";
import FormField from "./FormField";
import FormFieldLabel from "./FormFieldLabel";
import FormInputText from "./FormInputText";
import FormTextareaAutosize from "./FormTextareaAutosize";
import Button from "../../component/Button";
import Icon from "../../component/Icon";
const User = tw.span`inline-block`;
const UserSmall = tw.small`inline-block text-sm ml-1 opacity-50`;
const UserButton = tw.button`inline-block ml-2`;
const UserTooltip = tw.button`whitespace-pre-wrap`;

type Props = {
    username: string;
};

const UserComponent: React.FC<Props> = ({ username }: Props) => {
    const [isOpen, updateIsOpen] = useState<boolean>(false);
    // const [modalClass, updateModalClass] = useState<Modal>(null);

    const [nickname, updateNickname] = useState("");
    const [memo, updateMemo] = useState("");
    const updateUserMemo = useSetRecoilState(UserMemoState);

    const getUserMemoInformation = useCallback(async () => {
        return await request("usermemo:one", username, {
            _id: "1",
            username: "username",
            nickname: "nickname",
            memo: "memo",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }, [username]);

    const onSubmitHandler = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            const usermemos = await request(
                "usermemo:store",
                {
                    username,
                    nickname,
                    memo,
                },
                []
            );

            updateUserMemo([...usermemos]);
            updateIsOpen(false);
        },
        [username, nickname, memo]
    );

    const openHandler = useCallback(() => {
        updateIsOpen(true);
    }, []);

    const closeHandler = useCallback(async () => {
        const usermemo = await getUserMemoInformation();

        if (usermemo) {
            updateNickname(usermemo.nickname);
            updateMemo(usermemo.memo);
        }

        updateIsOpen(false);
    }, []);

    useEffect(() => {
        getUserMemoInformation().then((usermemo) => {
            if (usermemo) {
                updateNickname(usermemo.nickname);
                updateMemo(usermemo.memo);
            }
        });
    }, []);

    return (
        <>
            <User>
                {memo.length ? (
                    <>
                        <span data-tip={memo ? memo : false}>
                            {nickname.length ? (
                                <>
                                    {nickname}
                                    <UserSmall>({username})</UserSmall>
                                </>
                            ) : (
                                username
                            )}
                        </span>
                        <ReactTooltip
                            place="right"
                            type="dark"
                            effect="solid"
                            getContent={(content) => {
                                return <UserTooltip>{content}</UserTooltip>;
                            }}
                        />
                    </>
                ) : (
                    <>
                        {nickname.length ? (
                            <>
                                {nickname}
                                <UserSmall>({username})</UserSmall>
                            </>
                        ) : (
                            username
                        )}
                    </>
                )}
            </User>

            <UserButton onClick={openHandler}>
                <Icon icon="pencil" />
            </UserButton>

            <Modal isOpen={isOpen}>
                <form tabIndex={-1} onSubmit={onSubmitHandler}>
                    <ModalHead onClose={closeHandler}>
                        <h5>{username}</h5>
                    </ModalHead>
                    <ModalBody>
                        <FormField>
                            <FormFieldLabel>
                                <FormattedMessage
                                    id="Common.Label.NickName"
                                    defaultMessage="Nick name"
                                />
                            </FormFieldLabel>
                            <FormInputText
                                type="text"
                                value={nickname}
                                onChange={(e) => {
                                    updateNickname(e.target.value);
                                }}
                            />
                        </FormField>
                        <FormField>
                            <FormFieldLabel>
                                <FormattedMessage
                                    id="Component.User.Memo"
                                    defaultMessage="Memo"
                                />
                            </FormFieldLabel>
                            <FormTextareaAutosize
                                value={memo}
                                onChange={(e) => {
                                    updateMemo(e.target.value);
                                }}
                            />
                        </FormField>
                    </ModalBody>
                    <ModalFoot>
                        <Button type="button" onClick={closeHandler}>
                            <FormattedMessage
                                id="Common.Close"
                                defaultMessage="Close"
                            />
                        </Button>
                        <Button type="submit" color="primary">
                            <FormattedMessage
                                id="Common.Submit"
                                defaultMessage="Submit"
                            />
                        </Button>
                    </ModalFoot>
                </form>
            </Modal>
        </>
    );
};

export default UserComponent;
