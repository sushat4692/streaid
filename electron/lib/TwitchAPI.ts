import { session } from "electron";
import {
    ApiClient,
    HelixPaginatedResult,
    HelixPrivilegedUser,
    HelixUser,
    HelixChannel,
    HelixGame,
    HelixTag,
} from "@twurple/api";
import { AccessToken } from "@twurple/auth";
import { ElectronAuthProvider } from "@twurple/auth-electron";
import isDev from "electron-is-dev";

// Store
import { HelixChannelUpdate } from "@twurple/api/lib/api/helix/channel/HelixChannelApi";

class TwitchAPI {
    _clientId = "";
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
                "channel:manage:broadcast",
                "chat:edit",
                "chat:read",
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
        try {
            const user = await this.client?.users.getMe().catch((e) => {
                console.error(e);
            });

            if (!user) {
                return null;
            }

            return user;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getUserByName(username: string): Promise<HelixUser | null> {
        try {
            const User = await this.client?.users.getUserByName(username);
            if (!User) {
                return null;
            }

            return User;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getUserById(id: string): Promise<HelixUser | null> {
        try {
            const User = await this.client?.users.getUserById(id);

            if (!User) {
                return null;
            }

            return User;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getChannelInfo(User: HelixUser): Promise<HelixChannel | null> {
        try {
            const channel = await this.client?.channels.getChannelInfo(User);

            if (!channel) {
                return null;
            }

            return channel;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async updateChannelInfo(User: HelixUser, data: HelixChannelUpdate) {
        try {
            await this.client?.channels.updateChannelInfo(User, data);
        } catch (e) {
            console.error(e);
        }
    }

    async getChannelTags(User: HelixUser): Promise<HelixTag[]> {
        try {
            const tags = await this.client?.streams.getStreamTags(User);

            if (!tags) {
                return [];
            }

            return tags;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async getGame(gameId: string): Promise<HelixGame | null> {
        try {
            const game = await this.client?.games.getGameById(gameId);

            if (!game) {
                return null;
            }

            return game;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getGameList(
        gameName: string
    ): Promise<HelixPaginatedResult<HelixGame> | null> {
        try {
            const gameList = await this.client?.search.searchCategories(
                gameName
            );

            if (!gameList) {
                return null;
            }

            return gameList;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getTagList() {
        try {
            const tagList = await this.client?.tags.getAllStreamTags();

            if (!tagList) {
                return null;
            }

            return tagList;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getClipsByUser(User: HelixUser) {
        try {
            const clipList = await this.client?.clips.getClipsForBroadcaster(
                User
            );

            if (!clipList) {
                return null;
            }

            return clipList;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async disconnect() {
        await session.defaultSession.clearStorageData();
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
