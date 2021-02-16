import { BrowserWindow } from "electron";
import tmi from "tmi.js";

// Model
import { pushChatter } from "../database/Chatter";
import { pushRaider } from "../database/Raider";

// Store
import store from "../store";
import ShoutOut from "./commands/ShoutOut";

class Bot {
    private _client: tmi.Client | null = null;

    get client() {
        return this._client;
    }

    /**
     * Connect to target channel
     */
    connect() {
        // Define configuration options
        const opts: tmi.Options = {
            options: { debug: true },
            connection: {
                secure: true,
                reconnect: true,
            },
            identity: {
                username: store.get("username"),
                password: store.get("password"),
            },
            channels: store.get("channels"),
        };

        // Create a client with our options
        this._client = tmi.client(opts);

        // Register our event handlers (defined below)
        this._client.on("message", this.onMessageHandler.bind(this));
        this._client.on("raided", this.onRaidedHandler.bind(this));
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
     * @param userstate
     * @param message
     * @param self
     */
    async onMessageHandler(
        channel: string,
        userstate: tmi.ChatUserstate,
        message: string,
        self: boolean
    ) {
        if (self) {
            return;
        }

        const messages = message.trim().split(/\s/);
        const commandName = messages.shift();

        console.log({ messages, commandName });

        let existsCommand: boolean = false;
        switch (commandName) {
            case "!dice": {
                const num = this.rollDice();
                this.client?.say(channel, `You rolled a ${num}`);
                existsCommand = true;
                break;
            }
            case "!so": {
                if (messages.length) {
                    ShoutOut(channel, messages[0]);
                } else {
                    console.log(
                        `* You need to add username: e.g. !so {username}`
                    );
                }
                existsCommand = true;
                break;
            }
        }

        if (existsCommand) {
            console.log(`* Executed ${commandName} command`);
        } else {
            console.log(`* Unknown command ${commandName}`);
        }

        await pushChatter(userstate);

        const win = this.getWindow();
        if (win) {
            win.webContents.send("bot:message", { channel, userstate });
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
        const raider = {
            username,
            viewers,
        };
        pushRaider({
            username,
            viewers,
        });

        const win = this.getWindow();
        if (win) {
            win.webContents.send("bot:raided", { channel, raider });
        }
    }

    /**
     * Command test
     *
     * @command dice
     */
    rollDice() {
        const sides = 6;
        return Math.floor(Math.random() * sides) + 1;
    }

    /**
     * Called every time the bot connects to Twitch chat
     *
     * @param addr
     * @param port
     */
    onConnectedHandler(addr: string, port: number) {
        console.log(`* Connected to ${addr}:${port}`);

        const win = this.getWindow();
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

        const win = this.getWindow();
        if (win) {
            win.webContents.send("bot:disconnected");
        }
    }

    /**
     * Get Electron Window
     * Now only one window, so get first window from getAllWindows
     */
    private getWindow() {
        const wins = BrowserWindow.getAllWindows();
        if (!wins.length) {
            return null;
        }
        return wins[0];
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
