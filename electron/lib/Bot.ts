import { BrowserWindow } from "electron";
import tmi from "tmi.js";

// Store
import store from "../store";

// Model
import Chatter from "../model/Chatter";

class Bot {
    private client: tmi.Client | null = null;

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
        this.client = tmi.client(opts);

        // Register our event handlers (defined below)
        this.client.on("message", this.onMessageHandler.bind(this));
        this.client.on("connected", this.onConnectedHandler.bind(this));
        this.client.on("disconnected", this.onDisConnectedHandler.bind(this));

        // Connect to Twitch:
        this.client.connect().catch(console.error);
    }

    async disconnect() {
        if (this.client) {
            await this.client.disconnect();
        }

        this.client = null;
    }

    // Called every time a message comes in
    async onMessageHandler(
        channel: string,
        userstate: tmi.ChatUserstate,
        message: string,
        self: boolean
    ) {
        if (self) {
            return;
        } // Ignore messages from the bot

        // Remove whitespace from chat message
        const commandName = message.trim();

        await Chatter.query().insert({
            user_name: userstate.username,
            display_name: userstate["display-name"],
        });

        // If the command is known, let's execute it
        if (commandName === "!dice") {
            const num = this.rollDice();
            this.client?.say(channel, `You rolled a ${num}`);
            console.log(`* Executed ${commandName} command`);
        } else {
            console.log(`* Unknown command ${commandName}`);
        }
    }

    // Function called when the "dice" command is issued
    rollDice() {
        const sides = 6;
        return Math.floor(Math.random() * sides) + 1;
    }

    // Called every time the bot connects to Twitch chat
    onConnectedHandler(addr: string, port: number) {
        console.log(`* Connected to ${addr}:${port}`);

        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.webContents.send("bot:connected");
        }
    }

    onDisConnectedHandler(reason: string) {
        console.log(`* Disconnected by ${reason}`);

        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.webContents.send("bot:disconnected");
        }
    }
}

export default new Bot();
