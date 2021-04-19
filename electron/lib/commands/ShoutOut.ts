// Library
import { getInstance as getTwichAPIInstance } from "../TwitchAPI";

// Store
import { getInstance as getStoreInstance } from "../../store";

// Socket
import { sendSocketEmit } from "../../server";

export const shoutOut = async (username: string, showWindow = "") => {
    if (!username) {
        return `* You need to add username: e.g. !so {username}`;
    }

    const TwitchAPI = getTwichAPIInstance();
    const store = getStoreInstance();

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
        return replaceVariableMessage(
            store.get("shoutout_not_found"),
            false,
            false
        );
    }

    const shoutOutChannel = await TwitchAPI.getChannelInfo(User);
    if (!shoutOutChannel) {
        return replaceVariableMessage(
            store.get("shoutout_failed"),
            true,
            false
        );
    }

    switch (showWindow) {
        case "info":
            sendSocketEmit("info", {
                id: User.id,
                name: User.name,
                displayName: User.displayName,
                description: User.description,
                type: User.type,
                broadcasterType: User.broadcasterType,
                profilePictureUrl: User.profilePictureUrl,
                offlinePlaceholderUrl: User.offlinePlaceholderUrl,
                views: User.views,
                creationDate: User.creationDate,
            });
            break;
    }

    return replaceVariableMessage(store.get("shoutout_message"));
};
