import styled from "@emotion/styled";
import tw from "twin.macro";

type Props = {
    isEnd?: boolean;
};

const FormFieldAction = styled.div<Props>(({ isEnd }) => [
    tw`flex justify-between`,
    isEnd ? tw`justify-end` : null,
]);

export default FormFieldAction;
