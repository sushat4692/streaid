import React from "react";
import tw from "twin.macro";

const Headline = tw.h1`flex items-center justify-center pt-10 md:pt-16 text-4xl md:text-5xl font-black`;
const Secondary = tw.h2`flex items-center justify-center mt-4 pb-10 md:pb-16 text-xl md:text-2xl font-normal`;

type Props = {
    secondary: string;
};
const DashboardHeadline: React.FC<Props> = ({ children, secondary }) => {
    return (
        <>
            <Headline>{children}</Headline>
            <Secondary>{secondary}</Secondary>
        </>
    );
};

export default DashboardHeadline;
