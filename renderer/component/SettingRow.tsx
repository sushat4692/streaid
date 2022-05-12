import tw from "twin.macro";
import styled from "@emotion/styled";

const SettingRow = styled.div(() => [
    tw`md:flex mb-2 pb-5 border-b border-dotted border-gray-300 dark:border-gray-500`,
    { [`&:last-child`]: tw`mb-0 pb-3 border-0` },
]);

export default SettingRow;
