import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import TextareaAutosize from "react-textarea-autosize";
import ReactTooltip from "react-tooltip";

// Recoil
import UserMemoState, { UserMemoRowType } from "../atom/UserMemo";

// Util
import { request } from "../util/request";

// Styles
import styles from "./User.module.css";

interface Props {
    username: string;
}

const UserComponent: React.FC<Props> = ({ username }: Props) => {
    const [isOpen, updateIsOpen] = useState<boolean>(false);
    // const [modalClass, updateModalClass] = useState<Modal>(null);

    const [nickname, updateNickname] = useState("");
    const [memo, updateMemo] = useState("");
    const updateUserMemo = useSetRecoilState(UserMemoState);

    const getUserMemoInformation = async () => {
        return await request<string, UserMemoRowType>(
            "usermemo:one",
            username,
            {
                _id: "1",
                username: "username",
                nickname: "nickname",
                memo: "memo",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        );
    };

    const onSubmitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        const usermemos = await request<
            { username: string; nickname: string; memo: string },
            UserMemoRowType[]
        >(
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
    };

    const openHandler = () => {
        updateIsOpen(true);
    };

    const closeHandler = async () => {
        const usermemo = await getUserMemoInformation();

        if (usermemo) {
            updateNickname(usermemo.nickname);
            updateMemo(usermemo.memo);
        }

        updateIsOpen(false);
    };

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
            <span className={styles.user}>
                {memo.length ? (
                    <>
                        <span data-tip={memo ? memo : false}>
                            {nickname.length ? (
                                <>
                                    {nickname}
                                    <small className={styles.user__small}>
                                        ({username})
                                    </small>
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
                                return (
                                    <div style={{ whiteSpace: "pre-wrap" }}>
                                        {content}
                                    </div>
                                );
                            }}
                        />
                    </>
                ) : (
                    <>
                        {nickname.length ? (
                            <>
                                {nickname}
                                <small className={styles.user__small}>
                                    ({username})
                                </small>
                            </>
                        ) : (
                            username
                        )}
                    </>
                )}
            </span>

            <button className={styles.user__button} onClick={openHandler}>
                <i className="bi bi-pencil" />
            </button>

            <Modal
                isOpen={isOpen}
                className={styles.modal}
                overlayClassName={styles.overlay}
            >
                <form tabIndex={-1} onSubmit={onSubmitHandler}>
                    <div className={styles.modal__head}>
                        <h5 className="modal-title">{username}</h5>
                        <button
                            type="button"
                            className={styles.modal__close}
                            aria-label="Close"
                            onClick={closeHandler}
                        />
                    </div>
                    <div className={styles.modal__body}>
                        <div className="form-field">
                            <label className="form-field__label">
                                <FormattedMessage
                                    id="Common.Label.NickName"
                                    defaultMessage="Nick name"
                                />
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                value={nickname}
                                onChange={(e) => {
                                    updateNickname(e.target.value);
                                }}
                            />
                        </div>
                        <div className="form-field">
                            <label className="form-field__label">
                                <FormattedMessage
                                    id="Component.User.Memo"
                                    defaultMessage="Memo"
                                />
                            </label>
                            <TextareaAutosize
                                value={memo}
                                className="form-control"
                                onChange={(e) => {
                                    updateMemo(e.target.value);
                                }}
                            />
                        </div>
                    </div>
                    <div className={styles.modal__foot}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={closeHandler}
                        >
                            <FormattedMessage
                                id="Common.Close"
                                defaultMessage="Close"
                            />
                        </button>
                        <button type="submit" className="btn is-primary">
                            <FormattedMessage
                                id="Common.Submit"
                                defaultMessage="Submit"
                            />
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default UserComponent;
