import { StylesConfig } from "react-select";
import tw from "twin.macro";

export const selectStyles = <T, M extends boolean>(): StylesConfig<T, M> => ({
    option: (provided, state) => ({
        ...{
            ...provided,
        },
        ...tw`text-gray-800!`,
        ...(state.isSelected ? tw`text-white!` : {}),
    }),
});
