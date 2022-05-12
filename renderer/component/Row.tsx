import tw from "twin.macro";
import styled from "@emotion/styled";

type Props = {
    col?: 2 | 3 | 4;
};

const Row = styled.div<Props>(({ col }) => [
    tw`grid gap-2`,
    col === 2 ? tw`grid-cols-1 md:grid-cols-2` : null,
    col === 3 ? tw`grid-cols-1 md:grid-cols-3` : null,
    col === 4 ? tw`grid-cols-1 md:grid-cols-4` : null,
]);

export default Row;
