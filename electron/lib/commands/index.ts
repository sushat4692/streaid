import { ChatUserstate } from "tmi.js";
import { ApplicationError } from "../../../types/ApplicationError";
import { CommandAllowType } from "../../../types/CommandAllow";

type CommandType = {
    allow: CommandAllowType;
    handler: (...args) => unknown;
};

const commandsList: {
    [key: string]: CommandType;
} = {};

export class NotFoundError extends ApplicationError {
    public name = "NotFoundError";
}

export class NotAllowedError extends ApplicationError {
    public name = "NotAllowedError";
}

export const useCommand = () => {
    const push = (name: string, command: CommandType) => {
        if (name[0] !== "!") {
            name = "!" + name;
        }

        commandsList[name] = command;
    };

    const remove = (name: string) => {
        if (name[0] !== "!") {
            name = "!" + name;
        }

        delete commandsList[name];
    };

    const get = (command: string, UserState: ChatUserstate | null = null) => {
        if (!commandsList.hasOwnProperty(command)) {
            throw new NotFoundError(`Unknown command ${command}`);
        }
        const commandAction = commandsList[command];

        const isAllow = (() => {
            if (!UserState || commandAction.allow === "everyone") {
                return true;
            }

            const badges = UserState.badges;
            if (!badges) {
                return false;
            }

            switch (commandAction.allow) {
                case "broadcaster":
                    return badges.broadcaster && badges.broadcaster == "1";
                case "mod":
                    return (
                        (badges.broadcaster && badges.broadcaster == "1") ||
                        (badges.moderator && badges.moderator == "1")
                    );
                case "vip":
                    return (
                        (badges.broadcaster && badges.broadcaster == "1") ||
                        (badges.moderator && badges.moderator == "1") ||
                        (badges.vip && badges.vip == "1")
                    );
            }
        })();

        if (!isAllow) {
            throw new NotAllowedError(
                `Not Allowed, Necesarry right "${commandAction.allow}"`
            );
        }

        return {
            run: async (...args) => {
                return await commandAction.handler(...args);
            },
        };
    };

    return {
        push,
        remove,
        get,
    };
};
