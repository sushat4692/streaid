import React, { useCallback } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Recoil
import ShoutOutMessageState from "../atom/SettingShoutOutMessage";
import ShoutOutNotFoundState from "../atom/SettingShoutOutNotFound";
import ShoutOutFailedState from "../atom/SettingShoutOutFailed";
import IsConnectingState from "../atom/IsConnecting";

// Utils
import { request } from "../util/request";

// Components
import Section from "../../component/Section";
import SectionHeader from "../../component/SectionHeader";
import FormField from "./FormField";
import FormFieldLabel from "./FormFieldLabel";
import FormFieldAction from "./FormFieldAction";
import FormTextareaAutosize from "./FormTextareaAutosize";
import Button from "../../component/Button";
import ButtonIcon from "../../component/ButtonIcon";
import Table from "./Table";
import TableThead from "./TableThead";
import TableTbody from "./TableTbody";
import TableRow from "./TableRow";
import TableHead from "./TableHead";
import TableData from "./TableData";
const Row = styled.div(() => [
    tw`grid grid-cols-1 gap-4`,
    { [`@media (min-width: 768px)`]: { gridTemplateColumns: `2fr 1fr` } },
]);
const Form = tw.form`md:mb-2`;
const Description = tw.div``;

const SettingShoutOutMessage: React.FC = () => {
    const [shoutOutMessage, updateShoutOutMessage] =
        useRecoilState(ShoutOutMessageState);
    const [shoutOutNotFound, updateShoutOutNotFound] = useRecoilState(
        ShoutOutNotFoundState
    );
    const [shoutOutFailed, updateShoutOutFailed] =
        useRecoilState(ShoutOutFailedState);
    const updateIsConnecting = useSetRecoilState(IsConnectingState);

    const submitHandler = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            updateIsConnecting(true);

            await request(
                "setting:shoutout_message",
                {
                    shoutout_message: shoutOutMessage,
                    shoutout_not_found: shoutOutNotFound,
                    shoutout_failed: shoutOutFailed,
                },
                null
            );

            updateIsConnecting(false);
        },
        [shoutOutMessage, shoutOutNotFound, shoutOutFailed]
    );

    return (
        <Section>
            <SectionHeader>
                <FormattedMessage
                    id="Component.SettingShoutOutMessage.Header"
                    defaultMessage="Shoutout Message"
                />
            </SectionHeader>

            <Row>
                <Form onSubmit={submitHandler}>
                    <FormField>
                        <FormFieldLabel htmlFor="shoutout_message">
                            <FormattedMessage
                                id="Component.SettingShoutOutMessage.Message"
                                defaultMessage="ShoutOut Message Template"
                            />
                        </FormFieldLabel>
                        <FormTextareaAutosize
                            name="shoutout_message"
                            id="shoutout_message"
                            rows={3}
                            value={shoutOutMessage}
                            onChange={(e) =>
                                updateShoutOutMessage(e.target.value)
                            }
                        />
                    </FormField>

                    <FormField>
                        <FormFieldLabel htmlFor="shoutout_failed">
                            <FormattedMessage
                                id="Component.SettingShoutOutMessage.Failed"
                                defaultMessage="Failed Message Template"
                            />
                        </FormFieldLabel>
                        <FormTextareaAutosize
                            name="shoutout_failed"
                            id="shoutout_failed"
                            rows={3}
                            value={shoutOutFailed}
                            onChange={(e) =>
                                updateShoutOutFailed(e.target.value)
                            }
                        />
                    </FormField>

                    <FormField>
                        <FormFieldLabel htmlFor="shoutout_not_found">
                            <FormattedMessage
                                id="Component.SettingShoutOutMessage.NotFound"
                                defaultMessage="Not Found Message Template"
                            />
                        </FormFieldLabel>
                        <FormTextareaAutosize
                            name="shoutout_not_found"
                            id="shoutout_not_found"
                            rows={3}
                            value={shoutOutNotFound}
                            onChange={(e) =>
                                updateShoutOutNotFound(e.target.value)
                            }
                        />
                    </FormField>

                    <FormFieldAction>
                        <Button color="primary">
                            <ButtonIcon icon="archive" />
                            <FormattedMessage
                                id="Common.Submit"
                                defaultMessage="Submit"
                            />
                        </Button>
                    </FormFieldAction>
                </Form>

                <Description>
                    <Table cols={[120, null]}>
                        <TableThead>
                            <TableRow>
                                <TableHead scope="col">
                                    <FormattedMessage
                                        id="Common.Variable.Variable"
                                        defaultMessage="Variable"
                                    />
                                </TableHead>
                                <TableHead scope="col">
                                    <FormattedMessage
                                        id="Common.Variable.Description"
                                        defaultMessage="Description"
                                    />
                                </TableHead>
                            </TableRow>
                        </TableThead>
                        <TableTbody>
                            <TableRow>
                                <TableData scope="row">
                                    <code>%url%</code>
                                </TableData>
                                <TableData>
                                    <FormattedMessage
                                        id="Common.Variable.Url.Description"
                                        defaultMessage="Target Channel URL"
                                    />
                                </TableData>
                            </TableRow>
                            <TableRow>
                                <TableData scope="row">
                                    <code>%username%</code>
                                </TableData>
                                <TableData>
                                    <FormattedMessage
                                        id="Common.Variable.Username.Description"
                                        defaultMessage="Target User Display Name"
                                    />
                                </TableData>
                            </TableRow>
                            <TableRow>
                                <TableData scope="row">
                                    <code>%user_id%</code>
                                </TableData>
                                <TableData>
                                    <FormattedMessage
                                        id="Common.Variable.UserId.Description"
                                        defaultMessage="Target User ID"
                                    />
                                </TableData>
                            </TableRow>
                            <TableRow>
                                <TableData scope="row">
                                    <code>%category%</code>
                                </TableData>
                                <TableData>
                                    <FormattedMessage
                                        id="Common.Variable.Category.Description"
                                        defaultMessage="Target Category/Game name"
                                    />
                                </TableData>
                            </TableRow>
                        </TableTbody>
                    </Table>
                </Description>
            </Row>
        </Section>
    );
};

export default SettingShoutOutMessage;
