import styled from "@emotion/styled";
import tw from "twin.macro";

const SectionBox = styled.div([
    tw`mt-5 mb-4 pb-8 pr-5 border-b border-dotted border-gray-300 dark:border-gray-500`,
    { [`&:last-child`]: tw`mb-0 pb-6 border-0` },
]);

export default SectionBox;
