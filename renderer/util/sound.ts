// Util
import { request } from "./request";

export const useSound = (mode: "chatter" | "host" | "chat" | "raid") => {
    const selectFileHandler = () => {
        return async (e: React.MouseEvent) => {
            e.preventDefault();

            if (await request("setting:notification:sound", mode, null)) {
                window.alert("Saved!");
            }
        };
    };

    const playFileHandler = () => {
        return async (e: React.MouseEvent) => {
            e.preventDefault();

            if (!(await request("setting:notification:play", mode, false))) {
                window.alert("Sound file is not defined!");
            }
        };
    };

    return {
        selectFileHandler,
        playFileHandler,
    };
};
