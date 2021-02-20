import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";

// Library
import { getInstance as getBotInstance } from "./lib/Bot";
import { getInstance as getTwichAPIInstance } from "./lib/TwitchAPI";

// Command
import ShoutOut from "./lib/commands/ShoutOut";

// Store
import store from "./store";

// Database
import {
    pushChannelTemplate,
    getChannelTemplate,
    removeChannelTemplate,
} from "./database/ChannelTemplate";

// Const
import { getCode } from "./const/language";

async function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    win.loadFile("index.html");
    // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", async () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on("ready", async () => {
    // const channel = await api.client.kraken.channels.getMyChannel()
});

ipcMain.handle("get:init", () => {
    return store.get("api.inited", false);
});

ipcMain.handle("get:settings", async () => {
    const TwitchAPI = getTwichAPIInstance();
    TwitchAPI.init("__twitch_api_key__");
    const token = await TwitchAPI.getAccessToken();
    const user = await TwitchAPI.getUserInfo();

    store.set("username", user?.name);
    store.set("password", token?.accessToken);

    store.set("api.inited", true);
    return {
        username: store.get("username"),
        channels: store.get("channels"),
    };
});

ipcMain.handle("save:settings", (_, values) => {
    store.set("channels", values.channels);

    return {
        username: store.get("username"),
        channels: store.get("channels"),
    };
});

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

const getChannelTempalteList = async () => {
    const templates = await getChannelTemplate();

    return templates.map((template) => {
        return {
            id: template._id,
            title: template.title,
            gameId: template.gameId,
            gameName: template.gameName,
            boxArtUrl: template.boxArtUrl,
            language: template.language,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
        };
    });
};

ipcMain.handle("channel:template", async () => {
    return await getChannelTempalteList();
});

ipcMain.handle("channel:template:push", async (_, values) => {
    await pushChannelTemplate(values);
    return await getChannelTempalteList();
});

ipcMain.handle("channel:template:delete", async (_, values) => {
    await removeChannelTemplate(values.id);
    return await getChannelTempalteList();
});

ipcMain.handle("signout", async () => {
    const Bot = getBotInstance();
    const TwitchAPI = getTwichAPIInstance();

    await Bot.disconnect();
    await TwitchAPI.disconnect();
    store.set("api.inited", false);

    return;
});

ipcMain.handle("bot:connect", () => {
    const Bot = getBotInstance();
    Bot.connect();

    return;
});

ipcMain.handle("bot:disconnect", () => {
    const Bot = getBotInstance();
    Bot.disconnect();

    return;
});

ipcMain.handle(
    "bot:shoutout",
    async (_e, values: { postChannel: string; username: string }) => {
        await ShoutOut(values.postChannel, values.username);
        return;
    }
);
