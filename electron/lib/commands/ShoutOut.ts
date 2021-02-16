// Library
import { getInstance as getBotInstance } from "../Bot";
import { getInstance as getTwichAPIInstance } from "../TwitchAPI";

const shoutOut = async (postChannel: string, username: string) => {
    const Bot = getBotInstance();
    const TwitchAPI = getTwichAPIInstance();

    if (!Bot.client) {
        return;
    }

    const User = await TwitchAPI.getUserByName(username);
    if (!User) {
        Bot.client.action(
            postChannel,
            `Target user "${username}" was't found, please check again`
        );
        return;
    }

    const shoutOutChannel = await TwitchAPI.getChannelInfo(User);
    if (!shoutOutChannel) {
        Bot.client.action(
            postChannel,
            `Failed to get Channel information of "${User.displayName}" channel, please try again later`
        );
        return;
    }

    Bot.client.action(
        postChannel,
        `Please check this Recommended Streamer "${User.displayName}". https://www.twitch.tv/${username} The last streaming was "${shoutOutChannel.gameName}".`
    );
};

export default shoutOut;
