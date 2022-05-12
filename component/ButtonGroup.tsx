import styled from "@emotion/styled";
import tw from "twin.macro";

import Button from "./Button";

const ButtonGroup = styled.div([
    tw`flex`,
    { [`${Button}`]: tw`rounded-none` },
    { [`${Button} + ${Button}`]: { marginLeft: 1 } },
    { [`${Button}:first-of-type`]: tw`rounded-tl rounded-bl` },
    { [`${Button}:last-of-type`]: tw`rounded-tr rounded-br` },
]);

export default ButtonGroup;
