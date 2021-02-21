// Library
import { getInstance as getBotInstance } from "../Bot";
import { getInstance as getTwichAPIInstance } from "../TwitchAPI";

// Store
import { getInstance as getStoreInstance } from "../../store";

const shoutOut = async (values: {
    postRoomId?: string;
    postChannel?: string;
    username: string;
}) => {
    const Bot = getBotInstance();
    const TwitchAPI = getTwichAPIInstance();
    const store = getStoreInstance();

    if (!Bot.client) {
        return;
    }

    if (!values.postRoomId && !values.postChannel) {
        return;
    }

    const channelName = await (async () => {
        if (values.postChannel) {
            return values.postChannel;
        }

        const User = await TwitchAPI.getUserById(values.postRoomId!);
        if (!User) {
            return null;
        }

        return User.name;
    })();

    if (!channelName) {
        return;
    }

    const replaceVariableMessage = (
        message: string,
        hasUser: boolean = true,
        hasChannel: boolean = true
    ) => {
        return message
            .replaceAll("%url%", `https://www.twitch.tv/${values.username}`)
            .replaceAll("%username%", hasUser ? User!.displayName : "")
            .replaceAll("%user_id%", values.username)
            .replaceAll(
                "%category%",
                hasChannel ? shoutOutChannel!.gameName : ""
            );
    };

    const User = await TwitchAPI.getUserByName(values.username);
    if (!User) {
        Bot.client.action(
            channelName,
            replaceVariableMessage(
                store.get("shoutout_not_found"),
                false,
                false
            )
        );
        return;
    }

    const shoutOutChannel = await TwitchAPI.getChannelInfo(User);
    if (!shoutOutChannel) {
        Bot.client.action(
            channelName,
            replaceVariableMessage(store.get("shoutout_failed"), true, false)
        );
        return;
    }

    Bot.client.action(
        channelName,
        replaceVariableMessage(store.get("shoutout_message"))
    );
};

export default shoutOut;
