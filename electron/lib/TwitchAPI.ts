import { session } from "electron";
import {
    AccessToken,
    ApiClient,
    HelixPaginatedResult,
    HelixPrivilegedUser,
    HelixUser,
    HelixChannel,
    HelixGame,
    HelixTag,
} from "twitch";
import { ElectronAuthProvider } from "twitch-electron-auth-provider";
import isDev from "electron-is-dev";

// Store
import { getInstance as getStoreInstance } from "../store";
import { HelixChannelUpdate } from "twitch/lib/API/Helix/Channel/HelixChannelApi";

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
            logger: {
                minLevel: isDev ? 4 : 0,
            },
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
                "user:edit:broadcast",
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

    async getUserById(id: string): Promise<HelixUser | null> {
        const User = await this.client?.helix.users.getUserById(id);

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

    async updateChannelInfo(User: HelixUser, data: HelixChannelUpdate) {
        await this.client?.helix.channels.updateChannelInfo(User, data);
    }

    async getChannelTags(User: HelixUser): Promise<HelixTag[]> {
        const tags = await this.client?.helix.streams.getStreamTags(User);

        if (!tags) {
            return [];
        }

        return tags;
    }

    async getGame(gameId: string): Promise<HelixGame | null> {
        const game = await this.client?.helix.games.getGameById(gameId);

        if (!game) {
            return null;
        }

        return game;
    }

    async getGameList(
        gameName: string
    ): Promise<HelixPaginatedResult<HelixGame> | null> {
        const gameList = await this.client?.helix.search.searchCategories(
            gameName
        );

        if (!gameList) {
            return null;
        }

        return gameList;
    }

    async getTagList() {
        const tagList = await this.client?.helix.tags.getAllStreamTags();

        if (!tagList) {
            return null;
        }

        return tagList;
    }

    async disconnect() {
        const store = getStoreInstance();
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
