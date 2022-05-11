import React from "react";
import { Range } from "react-range";
import styled from "@emotion/styled";
import tw from "twin.macro";

type Props = {
    min?: number;
    max?: number;
    step?: number;
    value: number;
    formatLabel?: (value: number) => string;
    onChange?: (value: number) => void;
};

const Wrapper = tw.div`flex items-center w-full`;
const Value = tw.span`flex-shrink-0 mr-5`;
const Field = tw.div`flex-grow`;
const Track = tw.div`bg-gray-400 h-0.5 w-full`;
const Thumb = tw.div`relative bg-gray-600 h-4 w-4 border border-solid border-white rounded-full`;
const ThumbValue = styled.span<{ isDragged: boolean }>(({ isDragged }) => [
    tw`absolute rounded-full bg-gray-700 text-white top-5 left-1/2 pointer-events-none opacity-0 transition-[opacity,top] py-1 px-3`,
    { transform: `translate(-50%)` },
    isDragged ? tw`top-7 opacity-100` : null,
]);

const FormInputRange: React.FunctionComponent<Props> = ({
    min,
    max,
    step,
    value,
    formatLabel,
    onChange,
}) => {
    return (
        <Wrapper>
            <Value>{formatLabel(value)}</Value>
            <Field>
                <Range
                    min={min}
                    max={max}
                    step={step}
                    values={[value]}
                    onChange={(values) => {
                        onChange(values[0]);
                    }}
                    renderTrack={({ props, children }) => {
                        // eslint-disable-next-line react/prop-types
                        const { style, ...rprops } = props;
                        return (
                            <Track
                                {...rprops}
                                style={{
                                    ...style,
                                }}
                            >
                                {children}
                            </Track>
                        );
                    }}
                    renderThumb={({ props, value, isDragged }) => {
                        // eslint-disable-next-line react/prop-types
                        const { style, ...rprops } = props;
                        return (
                            <Thumb
                                {...rprops}
                                style={{
                                    ...style,
                                }}
                            >
                                <ThumbValue isDragged={isDragged}>
                                    {formatLabel(value)}
                                </ThumbValue>
                            </Thumb>
                        );
                    }}
                />
            </Field>
        </Wrapper>
    );
};

FormInputRange.defaultProps = {
    formatLabel: (value) => `${value}`,
};

export default FormInputRange;
