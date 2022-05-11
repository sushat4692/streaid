import React, { useCallback, useRef } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { FormattedMessage, useIntl } from "react-intl";
import Select from "react-select";
import tw from "twin.macro";
import styled from "@emotion/styled";

// Types
import { DefaultSelectType } from "../../types/DefaultSelect";

// Const
import { selectStyles } from "../const/selectStyles";
const localeStyle = selectStyles<DefaultSelectType, false>();

// Recoil
import LocaleState from "../atom/Locale";
import IsInitedState from "../atom/IsInited";

// Component
import Meta from "../component/Meta";
import Container from "../../component/Container";
import Button from "../../component/Button";
import Icon from "../../component/Icon";
const Wrapper = tw.section`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`;
const Title = tw.h1`font-bold text-2xl md:text-5xl py-4 mb-4 text-center`;
const TitleIcon = styled(Icon)(tw`mr-2 text-4xl md:text-7xl`);
const Form = tw.div`w-full max-w-xs mx-auto`;
const FormLabel = tw.h2`font-extrabold text-xl md:text-3xl mb-4 text-center`;
const FormSelect = tw.div`mb-6`;

// Utils
import { request } from "../util/request";

// Const
import { list as localeList } from "../const/locales";

const InitComponent: React.FC = () => {
    const intl = useIntl();
    const [locale, updateLocate] = useRecoilState(LocaleState);
    const updateIsInited = useSetRecoilState(IsInitedState);
    const defaultLocale = useRef(localeList.find((e) => e.value === locale));

    const updateLocaleHandler = useCallback(
        async (e: { label: string; value: string }) => {
            updateLocate(e.value);
            await request("setting:locale:update", e.value, null);
        },
        []
    );

    const clickHandler = useCallback(async () => {
        await request("setting:get", {}, null);
        updateIsInited(true);
    }, []);

    return (
        <Container>
            <Meta />

            <Wrapper>
                <div>
                    <Title>
                        <TitleIcon icon={`twitch`} />
                        <FormattedMessage
                            id="Common.Title"
                            defaultMessage="Twitch Support Tool"
                        />
                    </Title>

                    <Form>
                        <FormLabel>
                            <FormattedMessage
                                id="View.Init.Header"
                                defaultMessage="Signin to Twitch"
                            />
                        </FormLabel>

                        <FormSelect>
                            <Select
                                name="locale"
                                id="locale"
                                styles={localeStyle}
                                defaultValue={defaultLocale.current}
                                options={localeList}
                                onChange={updateLocaleHandler}
                                placeholder={intl.formatMessage({
                                    id: "Common.Select.Placeholder",
                                    defaultMessage: "Select...",
                                })}
                            />
                        </FormSelect>

                        <Button
                            block
                            size="large"
                            color="primary"
                            onClick={clickHandler}
                        >
                            <FormattedMessage
                                id="Common.SignIn"
                                defaultMessage="Signin"
                            />
                        </Button>
                    </Form>
                </div>
            </Wrapper>
        </Container>
    );
};

export default InitComponent;
