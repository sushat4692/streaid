// Util
import { useCallback } from "react";
import { request } from "./request";

export const useSound = (mode: "chatter" | "host" | "chat" | "raid") => {
    const selectFileHandler = useCallback(() => {
        return async (e: React.MouseEvent) => {
            e.preventDefault();

            if (await request("setting:notification:sound", mode, null)) {
                window.alert("Saved!");
            }
        };
    }, [mode]);

    const playFileHandler = useCallback(() => {
        return async (e: React.MouseEvent) => {
            e.preventDefault();

            if (!(await request("setting:notification:play", mode, false))) {
                window.alert("Sound file is not defined!");
            }
        };
    }, [mode]);

    return {
        selectFileHandler,
        playFileHandler,
    };
};
