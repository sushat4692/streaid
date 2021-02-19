import { session } from "electron";
import {
    AccessToken,
    ApiClient,
    HelixPrivilegedUser,
    HelixUser,
    HelixChannel,
    HelixGame,
} from "twitch";
import { ElectronAuthProvider } from "twitch-electron-auth-provider";

// Store
import store from "../store";

class TwitchAPI {
    _clientId: string = "";
    _client: ApiClient | null = null;
    _provider: ElectronAuthProvider | null = null;
    _accessToken: AccessToken | void | null = null;

    init(clientId: string) {
        this._clientId = clientId;

        const redirectUri = "http://localhost/oauth.html";
        this._provider = new ElectronAuthProvider({
            clientId: this._clientId,
            redirectUri,
        });

        this._client = new ApiClient({
            authProvider: this._provider,
        });
    }

    get clientId(): string {
        return this._clientId;
    }

    get client(): ApiClient | null {
        return this._client;
    }

    get provider(): ElectronAuthProvider | null {
        return this._provider;
    }

    get acessToken(): AccessToken | void | null {
        return this._accessToken;
    }

    async getAccessToken(): Promise<AccessToken | null> {
        if (!this._provider) {
            return null;
        }

        this._accessToken = await this._provider
            .getAccessToken([
                "user:read:email",
                "channel_read",
                "channel_editor",
                "chat:read",
                "chat:edit",
                "channel:moderate",
                "whispers:read",
                "whispers:edit",
            ])
            .catch((e) => {
                console.error(e);
            });

        if (!this._accessToken) {
            return null;
        }

        return this._accessToken;
    }

    async getUserInfo(): Promise<HelixPrivilegedUser | null> {
        const user = await this.client?.helix.users.getMe().catch((e) => {
            console.error(e);
        });

        if (!user) {
            return null;
        }

        return user;
    }

    async getUserByName(username: string): Promise<HelixUser | null> {
        const User = await this.client?.helix.users.getUserByName(username);

        if (!User) {
            return null;
        }

        return User;
    }

    async getChannelInfo(User: HelixUser): Promise<HelixChannel | null> {
        const channel = await this.client?.helix.channels.getChannelInfo(User);

        if (!channel) {
            return null;
        }

        return channel;
    }

    async getGame(gameId: string): Promise<HelixGame | null> {
        const game = await this.client?.helix.games.getGameById(gameId);

        if (!game) {
            return null;
        }

        return game;
    }

    async getGamesList(gameName: string): Promise<HelixGame[]> {
        const gameList = await this.client?.helix.games.getGamesByNames([
            gameName,
        ]);

        if (!gameList) {
            return [];
        }

        return gameList;
    }

    async disconnect() {
        await session.defaultSession.clearStorageData();
        store.clear();
    }
}

export default TwitchAPI;

let instance: TwitchAPI;
export const getInstance = () => {
    if (!instance) {
        instance = new TwitchAPI();
    }

    return instance;
};
