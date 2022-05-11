import styled from "@emotion/styled";
import tw from "twin.macro";

import TableRow from "./TableRow";

const TableThead = styled.thead([
    {
        [`${TableRow}`]: tw`border-b-2 border-solid border-gray-300 dark:border-gray-500`,
    },
]);

export default TableThead;
