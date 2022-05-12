import styled from "@emotion/styled";
import tw from "twin.macro";

type Props = {
    color?: "warning";
};

const Alert = styled.div<Props>(({ color }) => [
    tw`py-2 px-3 mb-2 border border-solid border-gray-300 dark:border-gray-500 bg-gray-200 dark:bg-gray-700 rounded`,
    color === "warning"
        ? tw`bg-red-100 dark:bg-red-800 border-red-300 dark:border-red-900`
        : null,
]);

export default Alert;
