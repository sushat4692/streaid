import React from "react";
import tw from "twin.macro";

const TableComponent = tw.table`w-full`;

type Props = {
    cols?: (number | null)[];
};

const Table: React.FunctionComponent<Props> = ({ children, cols }) => {
    return (
        <TableComponent>
            {cols ? (
                <colgroup>
                    {cols.map((col, i) => (
                        <col key={i} width={col} />
                    ))}
                </colgroup>
            ) : null}
            {children}
        </TableComponent>
    );
};

export default Table;
