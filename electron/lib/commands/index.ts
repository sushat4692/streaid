import { rollDice } from "./Dice";
import { shoutOut, shoutOutClipStop } from "./ShoutOut";

export const useCommand = () => {
    const commands = {
        "!dice": rollDice,
        "!so": shoutOut,
        "!stop": shoutOutClipStop,
    };

    const exists = (command: string) => {
        return commands.hasOwnProperty(command);
    };

    const trigger = async (command: string, ...args) => {
        if (!exists(command)) {
            return false;
        }

        return await commands[command](...args);
    };

    return {
        exists,
        trigger,
    };
};
