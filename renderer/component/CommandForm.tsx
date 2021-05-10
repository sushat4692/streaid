import React, { useState } from "react";
import Modal from "react-modal";
import { useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import TextareaAutosize from "react-textarea-autosize";
import Select from "react-select";

// Types
import { CommandAllowType } from "../../types/CommandAllow";

// Recoil
import CommandsState from "../atom/Commands";

// Utility
import { request } from "../util/request";

const CommandFormComponent: React.FC = () => {
    const intl = useIntl();
    const allowOptions = [
        {
            value: "everyone",
            label: intl.formatMessage({ id: `Component.Command.everyone` }),
        },
        {
            value: "vip",
            label: intl.formatMessage({ id: `Component.Command.vip` }),
        },
        {
            value: "mod",
            label: intl.formatMessage({ id: `Component.Command.mod` }),
        },
        {
            value: "broadcaster",
            label: intl.formatMessage({
                id: `Component.Command.broadcaster`,
            }),
        },
    ];

    const [isOpen, updateIsOpen] = useState<boolean>(false);
    const [inputCommand, updateInputCommand] = useState<string>("");
    const [inputBody, updateInputBody] = useState<string>("");
    const [inputMemo, updateInputMemo] = useState<string>("");
    const [inputAllow, updateInputAllow] = useState<CommandAllowType>(null);

    const updateCommands = useSetRecoilState(CommandsState);

    const openHandler = () => {
        updateInputCommand("");
        updateInputBody("");
        updateInputMemo("");
        updateInputAllow(null);

        updateIsOpen(true);
    };

    const closeHandler = () => {
        updateIsOpen(false);
    };

    const onSubmitHandler = async (e: React.FormEvent) => {
        e.preventDefault();

        const commands = await request(
            "command:push",
            {
                command: inputCommand,
                body: inputBody,
                memo: inputMemo,
                allow: inputAllow,
            },
            [
                {
                    _id: "1",
                    command: "Command1",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "broadcaster",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    command: "Command2",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "mod",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "3",
                    command: "Command3",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "vip",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "4",
                    command: "Command4",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "everyone",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]
        );

        updateCommands([...commands]);
        updateIsOpen(false);
    };

    return (
        <>
            <button className="btn is-primary" onClick={openHandler}>
                <FormattedMessage
                    id="Component.Command.New"
                    defaultMessage="New Command"
                />
            </button>

            <Modal isOpen={isOpen} className="modal" overlayClassName="overlay">
                <form tabIndex={-1} onSubmit={onSubmitHandler}>
                    <div className="modal__head">
                        <h5 className="modal-title">
                            <FormattedMessage
                                id="Component.Command.New"
                                defaultMessage="New Command"
                            />
                        </h5>
                        <button
                            type="button"
                            className="modal__close"
                            aria-label="Close"
                            onClick={closeHandler}
                        />
                    </div>
                    <div className="modal__body">
                        <div className="form-field">
                            <label className="form-field__label">
                                <FormattedMessage
                                    id="Common.Label.Command"
                                    defaultMessage="Command"
                                />
                            </label>

                            <div className="form-control-group">
                                <span className="form-control-group__label">
                                    !
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={inputCommand}
                                    onChange={(e) => {
                                        updateInputCommand(e.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="form-field__label">
                                <FormattedMessage
                                    id="Common.Label.Body"
                                    defaultMessage="Body"
                                />
                            </label>
                            <TextareaAutosize
                                className="form-control"
                                value={inputBody}
                                onChange={(e) => {
                                    updateInputBody(e.target.value);
                                }}
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-field__label">
                                <FormattedMessage
                                    id="Common.Label.Memo"
                                    defaultMessage="Memo"
                                />
                            </label>
                            <TextareaAutosize
                                className="form-control"
                                value={inputMemo}
                                onChange={(e) => {
                                    updateInputMemo(e.target.value);
                                }}
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-field__label">
                                <FormattedMessage
                                    id="Common.Label.Priviledge"
                                    defaultMessage="Priviledge"
                                />
                            </label>

                            <Select
                                classNamePrefix="react-select"
                                options={allowOptions}
                                onChange={(e) =>
                                    updateInputAllow(
                                        e.value as CommandAllowType
                                    )
                                }
                                placeholder={intl.formatMessage({
                                    id: "Common.Select.Placeholder",
                                    defaultMessage: "Select...",
                                })}
                            ></Select>
                        </div>
                    </div>
                    <div className="modal__foot">
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

export default CommandFormComponent;
