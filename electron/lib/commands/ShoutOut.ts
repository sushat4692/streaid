// Library
import { getInstance as getBotInstance } from "../Bot";
import { getInstance as getTwichAPIInstance } from "../TwitchAPI";

const shoutOut = async (postChannel: string, username: string) => {
    const Bot = getBotInstance();
    const TwitchAPI = getTwichAPIInstance();

    if (!Bot.client) {
        return;
    }

    console.log(postChannel);
    console.log(username);

    const User = await TwitchAPI.getUserByName(username);
    if (!User) {
        return;
    }

    const shoutOutChannel = await TwitchAPI.getChannelInfo(User);
    if (!shoutOutChannel) {
        return;
    }

    Bot.client.action(
        postChannel,
        `Please check this Recommended Streamer "${User.displayName}". https://www.twitch.tv/${username} The last streaming was "${shoutOutChannel.gameName}".`
    );
};

export default shoutOut;
