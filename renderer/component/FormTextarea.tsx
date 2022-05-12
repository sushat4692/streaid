import tw from "twin.macro";
import styled from "@emotion/styled";

type Props = {
    large?: boolean;
};

const FormTextarea = styled.textarea<Props>(({ large }) => [
    tw`block w-full h-9 rounded py-1 px-2 border border-solid border-gray-300 dark:border-gray-500`,
    large ? tw`text-lg h-12 py-2 px-3` : null,
]);

export default FormTextarea;
