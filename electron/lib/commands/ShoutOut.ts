// Library
import { getInstance as getBotInstance } from "../Bot";
import { getInstance as getTwichAPIInstance } from "../TwitchAPI";

// Store
import { getInstance as getStoreInstance } from "../../store";

const shoutOut = async (username: string) => {
    const Bot = getBotInstance();
    const TwitchAPI = getTwichAPIInstance();
    const store = getStoreInstance();

    if (!Bot.client) {
        return;
    }

    const channelName = store.get("channel");
    if (!channelName) {
        return;
    }

    const replaceVariableMessage = (
        message: string,
        hasUser = true,
        hasChannel = true
    ) => {
        return message
            .replaceAll("%url%", `https://www.twitch.tv/${username}`)
            .replaceAll("%username%", hasUser && User ? User.displayName : "")
            .replaceAll("%user_id%", username)
            .replaceAll(
                "%category%",
                hasChannel && shoutOutChannel ? shoutOutChannel.gameName : ""
            );
    };

    const User = await TwitchAPI.getUserByName(username);
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
