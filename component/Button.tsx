import styled from "@emotion/styled";
import tw from "twin.macro";

type Props = {
    size?: "small" | "large";
    block?: boolean;
    disabled?: boolean;
    stretched?: boolean;
    color?: "primary" | "danger";
};

const Button = styled.button<Props>(
    ({ size, block, disabled, stretched, color }) => {
        return [
            tw`text-base inline-flex items-center justify-center rounded bg-gray-600 hover:bg-gray-700 text-white py-1 px-3`,
            size === "small" ? tw`text-sm py-1 px-2` : null,
            size === "large" ? tw`text-lg font-bold py-2 px-4` : null,
            block ? tw`flex w-full px-2` : null,
            disabled ? tw`pointer-events-none opacity-50` : null,
            color === "primary"
                ? {
                      backgroundColor: `var(--color-primary)`,
                      "&:hover": {
                          backgroundColor: `var(--color-primary--hover)`,
                      },
                  }
                : null,
            color === "danger"
                ? tw`bg-red-600 hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-900`
                : null,
            stretched
                ? {
                      "&::after": [
                          { content: `""` },
                          tw`block absolute inset-0`,
                      ],
                  }
                : null,
        ];
    }
);

export default Button;
