import { IpcRendererEvent } from "electron";

// Types
import "../../types/window";
import {
    ModeType as RequestModeType,
    ValuesType as RequestValuesType,
    ReturnsType as RequestReturnsType,
} from "../../types/Request";
import {
    ModeType as RequestEventModeType,
    ValuesType as RequestEventValuesType,
} from "../../types/RequestEvent";

export const request = async <T extends RequestModeType>(
    key: T,
    args: RequestValuesType[T],
    _default: RequestReturnsType[T]
): Promise<RequestReturnsType[T]> => {
    if (typeof window.api === "undefined") {
        return new Promise((resolve) => resolve(_default));
    } else {
        return await window.api.invoke(key, args);
    }
};

export const requestEvent = <
    T extends RequestEventModeType,
    R extends (event: IpcRendererEvent, args: RequestEventValuesType[T]) => void
>(
    key: T,
    callback: R
) => {
    if (typeof window.api !== "undefined") {
        window.api.on(key, callback);
    }
};
