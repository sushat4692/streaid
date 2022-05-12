import styled from "@emotion/styled";
import tw from "twin.macro";

import Button from "../../component/Button";
import FormInputText from "./FormInputText";
import FormGroupLabel from "./FormGroupLabel";

const FormGroup = styled.div([
    tw`flex`,
    {
        [`${FormInputText}, ${Button}, ${FormGroupLabel}`]: tw`rounded-none`,
        [`${Button}, ${FormGroupLabel}`]: tw`flex-shrink-0`,
        [`${FormInputText}:first-child, ${Button}:first-child, ${FormGroupLabel}:first-child`]: tw`rounded-tl rounded-bl`,
        [`${FormInputText}:first-child`]: tw`border-l`,
        [`${FormInputText}:last-child, ${Button}:last-child, ${FormGroupLabel}:last-child`]: tw`rounded-tr rounded-br`,
        [`${FormInputText}:last-child`]: tw`border-l`,
    },
]);

export default FormGroup;
