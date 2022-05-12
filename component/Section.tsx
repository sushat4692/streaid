import styled from "@emotion/styled";
import tw from "twin.macro";

const Section = styled.section({
    "& + &": tw`pt-5 mt-5 border-t border-solid border-gray-300 dark:border-gray-500`,
});

export default Section;
