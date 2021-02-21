import { ipcMain } from "electron";

// Library
import { getInstance as getTwichAPIInstance } from "../lib/TwitchAPI";

// Const
import { getCode } from "../const/language";

ipcMain.handle("channel:info", async (_, values) => {
    const TwitchAPI = getTwichAPIInstance();

    const User = await TwitchAPI.getUserByName(values.username);
    if (!User) {
        return false;
    }

    const Channel = await TwitchAPI.getChannelInfo(User);
    if (!Channel) {
        return false;
    }

    const Tags = await TwitchAPI.getChannelTags(User);

    return {
        id: Channel.id,
        name: Channel.name,
        displayName: Channel.displayName,
        language: Channel.language,
        gameId: Channel.gameId,
        gameName: Channel.gameName,
        title: Channel.title,
        tags: Tags.map((Tag) => {
            return {
                id: Tag.id,
                isAuto: Tag.isAuto,
                name: Tag.getName(getCode(Channel.language)),
                description: Tag.getDescription(getCode(Channel.language)),
            };
        }),
    };
});

ipcMain.handle("channel:game", async (_, values) => {
    const TwitchAPI = getTwichAPIInstance();
    const game = await TwitchAPI.getGame(values.gameId);

    if (!game) {
        return null;
    }

    return {
        id: game.id,
        name: game.name,
        boxArtUrl: game.boxArtUrl,
    };
});

ipcMain.handle("channel:games", async (_, values) => {
    const TwitchAPI = getTwichAPIInstance();
    const games = await TwitchAPI.getGameList(values.gameName);

    if (!games) {
        return [];
    }

    return games.data.map((game) => {
        return {
            id: game.id,
            name: game.name,
            boxArtUrl: game.boxArtUrl,
        };
    });
});

ipcMain.handle("channel:tags", async (_, values) => {
    const TwitchAPI = getTwichAPIInstance();
    const tags = await TwitchAPI.getTagList();

    const User = await TwitchAPI.getUserByName(values.username);
    if (!User) {
        return [];
    }

    const Channel = await TwitchAPI.getChannelInfo(User);
    if (!Channel) {
        return [];
    }

    if (!tags) {
        return [];
    }

    return tags.data.map((Tag) => {
        return {
            id: Tag.id,
            isAuto: Tag.isAuto,
            name: Tag.getName(getCode(Channel.language)),
            description: Tag.getDescription(getCode(Channel.language)),
        };
    });
});

ipcMain.handle("channel:update", async (_, values) => {
    const TwitchAPI = getTwichAPIInstance();

    const User = await TwitchAPI.getUserByName(values.username);
    if (!User) {
        return [];
    }

    TwitchAPI.updateChannelInfo(User, {
        title: values.title,
        gameId: values.gameId,
        language: values.language,
    });
});
