import { Notification } from "electron";
import tmi from "tmi.js";

// Model
import { getChatters, pushChatter } from "../database/Chatter";
import { getRaiders, pushRaider } from "../database/Raider";
import { getHosts, pushHost } from "../database/Host";
import { getCommands } from "../database/Command";

// Store
import { getInstance as getStoreInstance } from "../store";
import { useCommand } from "./commands";
import { rollDice } from "./commands/Dice";
import { shoutOut, shoutOutClipStop } from "./commands/ShoutOut";

// Util
import { getWindow } from "../util/window";
import { playSound } from "../util/Sound";
import { useEnv } from "../util/Env";

class Bot {
    private _client: tmi.Client | null = null;

    constructor() {
        const commandModel = useCommand();

        // Default Command
        commandModel.push("!dice", {
            allow: "everyone",
            handler: rollDice,
        });

        commandModel.push("!so", {
            allow: "mod",
            handler: shoutOut,
        });

        commandModel.push("!stop", {
            allow: "mod",
            handler: shoutOutClipStop,
        });

        (async () => {
            // Custom Command
            const commands = await getCommands();
            commands.map((command) => {
                commandModel.push(command.command, {
                    allow: command.allow,
                    handler: () => command.body,
                });
            });
        })();
    }

    get client() {
        return this._client;
    }

    /**
     * Connect to target channel
     */
    connect() {
        const store = getStoreInstance();
        const env = useEnv();

        // Define configuration options
        const opts: tmi.Options = {
            options: { debug: env.get("mode") !== "production" },
            connection: {
                secure: true,
                reconnect: true,
            },
            identity: {
                username: store.get("username"),
                password: store.get("password"),
            },
            channels: [store.get("channel")],
        };

        // Create a client with our options
        this._client = tmi.client(opts);

        // Register our event handlers (defined below)
        this._client.on("message", this.onMessageHandler.bind(this));
        this._client.on("raided", this.onRaidedHandler.bind(this));
        this._client.on("hosted", this.onHostedHandler.bind(this));
        this._client.on("connected", this.onConnectedHandler.bind(this));
        this._client.on("disconnected", this.onDisConnectedHandler.bind(this));

        // Connect to Twitch:
        this._client.connect().catch(console.error);
    }

    /**
     * Disconnected
     */
    async disconnect() {
        if (this.client) {
            await this.client.disconnect();
        }

        this._client = null;
    }

    /**
     * Called every time a message comes in
     *
     * @param channel
     * @param UserState
     * @param message
     * @param self
     */
    async onMessageHandler(
        channel: string,
        UserState: tmi.ChatUserstate,
        message: string,
        self: boolean
    ) {
        if (self) {
            return;
        }

        const messages = message.trim().split(/\s/);
        const commandName = messages.shift();

        // Run command
        if (commandName && commandName.charAt(0) === "!") {
            const command = useCommand();

            try {
                const message = await command
                    .get(commandName, UserState)
                    .run(...messages);

                if (message && typeof message === "string") {
                    this.client?.action(channel, message);
                }

                console.log(`* Executed ${commandName} command`);
            } catch (e) {
                return;
            }
        }

        const win = getWindow();

        if (await pushChatter(UserState)) {
            const notification = new Notification({
                title: `Chatter has come`,
                body: `Thank you for coming "${UserState["display-name"]}"`,
                silent: true,
            });
            notification.show();
            playSound(win, "chatter");
        } else {
            playSound(win, "chat");
        }

        if (win) {
            win.webContents.send("bot:chatted", await getChatters());
        }
    }

    /**
     * Called every time a raider comes in
     *
     * @param channel
     * @param username
     * @param viewers
     */
    async onRaidedHandler(channel: string, username: string, viewers: number) {
        pushRaider({
            channel,
            username,
            viewers,
        });

        const win = getWindow();
        const notification = new Notification({
            title: `${viewers} Raider has come`,
            body: `Thank you for raiding "${username}"`,
            silent: true,
        });
        notification.show();
        playSound(win, "raid");

        if (win) {
            win.webContents.send("bot:raided", await getRaiders());
        }
    }

    /**
     * Called every time a hosted
     *
     * @param channel
     * @param username
     * @param viewers
     */
    async onHostedHandler(
        channel: string,
        username: string,
        viewers: number,
        autohost: boolean
    ) {
        pushHost({
            channel,
            username,
            viewers,
            autohost,
        });

        const win = getWindow();
        const notification = new Notification({
            title: `Start ${viewers} Hosting`,
            body: `Thank you for hosting "${username}"`,
            silent: true,
        });
        notification.show();
        playSound(win, "host");

        if (win) {
            win.webContents.send("bot:hosted", await getHosts());
        }
    }

    /**
     * Called every time the bot connects to Twitch chat
     *
     * @param addr
     * @param port
     */
    onConnectedHandler(addr: string, port: number) {
        console.log(`* Connected to ${addr}:${port}`);

        const win = getWindow();
        if (win) {
            win.webContents.send("bot:connected");
        }
    }

    /**
     * Called every time the bot disconnects from Twitch chat
     *
     * @param reason
     */
    onDisConnectedHandler(reason: string) {
        console.log(`* Disconnected by ${reason}`);

        const win = getWindow();
        if (win) {
            win.webContents.send("bot:disconnected");
        }
    }
}

export default Bot;

let instance: Bot;
export const getInstance = () => {
    if (!instance) {
        instance = new Bot();
    }

    return instance;
};
