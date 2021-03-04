import React, { useEffect, useState, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import TextareaAutosize from "react-textarea-autosize";
import { Modal } from "bootstrap";

// Recoil
import UserMemoState, { UserMemoRowType } from "../atom/UserMemo";

// Util
import { request } from "../util/request";

interface Props {
    username: string;
}

const UserComponent: React.FC<Props> = ({ username }: Props) => {
    const modal = useRef<HTMLFormElement>(null);
    const [modalClass, updateModalClass] = useState<Modal>(null);

    const [nickname, updateNickname] = useState("");
    const [memo, updateMemo] = useState("");
    const updateUserMemo = useSetRecoilState(UserMemoState);

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
        if (modalClass) {
            modalClass.toggle();
        }
    };

    useEffect(() => {
        if (modal.current) {
            updateModalClass(new Modal(modal.current));
        }

        request<string, UserMemoRowType>("usermemo:one", username, {
            _id: "1",
            username: "username",
            nickname: "nickname",
            memo: "memo",
            createdAt: new Date(),
            updatedAt: new Date(),
        }).then((usermemo) => {
            if (usermemo) {
                updateNickname(usermemo.nickname);
                updateMemo(usermemo.memo);
            }
        });
    }, []);

    return (
        <>
            <button
                className="btn btn-link"
                onClick={() => {
                    if (modalClass) {
                        modalClass.toggle();
                    }
                }}
            >
                {username}
            </button>

            <form
                className="modal fade"
                tabIndex={-1}
                onSubmit={onSubmitHandler}
                ref={modal}
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{username}</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => {
                                    if (modalClass) {
                                        modalClass.hide();
                                    }
                                }}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">
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
                                ></input>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">
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
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    if (modalClass) {
                                        modalClass.hide();
                                    }
                                }}
                            >
                                <FormattedMessage
                                    id="Common.Close"
                                    defaultMessage="Close"
                                />
                            </button>
                            <button type="submit" className="btn btn-primary">
                                <FormattedMessage
                                    id="Common.Submit"
                                    defaultMessage="Submit"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};

export default UserComponent;
