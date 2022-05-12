import React, { useState, useRef, useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";

// Types
import { CommandAllowType } from "../../types/CommandAllow";
import { DefaultSelectType } from "../../types/DefaultSelect";

// Const
import { selectStyles } from "../const/selectStyles";
const commandStyle = selectStyles<DefaultSelectType, false>();

// Recoil
import CommandsState from "../atom/Commands";

// Utility
import { request } from "../util/request";

// Components
import Button from "../../component/Button";
import Modal from "./Modal";
import ModalHead from "./ModalHead";
import ModalBody from "./ModalBody";
import ModalFoot from "./ModalFoot";
import FormField from "./FormField";
import FormFieldLabel from "./FormFieldLabel";
import FormTextareaAutosize from "./FormTextareaAutosize";
import FormGroup from "./FormGroup";
import FormGroupLabel from "./FormGroupLabel";
import FormInputText from "./FormInputText";

const CommandFormComponent: React.FC = () => {
    const intl = useIntl();
    const allowOptions = useRef([
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
    ]);

    const [isOpen, updateIsOpen] = useState<boolean>(false);
    const [inputCommand, updateInputCommand] = useState<string>("");
    const [inputBody, updateInputBody] = useState<string>("");
    const [inputMemo, updateInputMemo] = useState<string>("");
    const [inputAllow, updateInputAllow] = useState<CommandAllowType>(null);

    const updateCommands = useSetRecoilState(CommandsState);

    const openHandler = useCallback(() => {
        updateInputCommand("");
        updateInputBody("");
        updateInputMemo("");
        updateInputAllow(null);

        updateIsOpen(true);
    }, []);

    const closeHandler = useCallback(() => {
        updateIsOpen(false);
    }, []);

    const onSubmitHandler = useCallback(
        async (e: React.FormEvent) => {
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
        },
        [inputCommand, inputBody, inputMemo, inputAllow]
    );

    return (
        <>
            <Button color="primary" onClick={openHandler}>
                <FormattedMessage
                    id="Component.Command.New"
                    defaultMessage="New Command"
                />
            </Button>

            <Modal isOpen={isOpen}>
                <form tabIndex={-1} onSubmit={onSubmitHandler}>
                    <ModalHead onClose={closeHandler}>
                        <h5>
                            <FormattedMessage
                                id="Component.Command.New"
                                defaultMessage="New Command"
                            />
                        </h5>
                    </ModalHead>
                    <ModalBody>
                        <FormField>
                            <FormFieldLabel>
                                <FormattedMessage
                                    id="Common.Label.Command"
                                    defaultMessage="Command"
                                />
                            </FormFieldLabel>

                            <FormGroup>
                                <FormGroupLabel>!</FormGroupLabel>
                                <FormInputText
                                    type="text"
                                    value={inputCommand}
                                    onChange={(e) => {
                                        updateInputCommand(e.target.value);
                                    }}
                                />
                            </FormGroup>
                        </FormField>

                        <FormField>
                            <FormFieldLabel>
                                <FormattedMessage
                                    id="Common.Label.Body"
                                    defaultMessage="Body"
                                />
                            </FormFieldLabel>
                            <FormTextareaAutosize
                                value={inputBody}
                                onChange={(e) => {
                                    updateInputBody(e.target.value);
                                }}
                            />
                        </FormField>

                        <FormField>
                            <FormFieldLabel>
                                <FormattedMessage
                                    id="Common.Label.Memo"
                                    defaultMessage="Memo"
                                />
                            </FormFieldLabel>
                            <FormTextareaAutosize
                                value={inputMemo}
                                onChange={(e) => {
                                    updateInputMemo(e.target.value);
                                }}
                            />
                        </FormField>

                        <FormField>
                            <FormFieldLabel>
                                <FormattedMessage
                                    id="Common.Label.Priviledge"
                                    defaultMessage="Priviledge"
                                />
                            </FormFieldLabel>

                            <Select
                                styles={commandStyle}
                                options={allowOptions.current}
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
                        </FormField>
                    </ModalBody>
                    <ModalFoot>
                        <Button type="button" onClick={closeHandler}>
                            <FormattedMessage
                                id="Common.Close"
                                defaultMessage="Close"
                            />
                        </Button>
                        <Button color="primary" type="submit">
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

export default CommandFormComponent;
