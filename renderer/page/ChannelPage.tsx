import React, { useEffect, useState } from "react";

// Store
import SettingChannelsStore from "../store/SettingChannels";
import IsConnectingStore from "../store/IsConnecting";

// Utility
import { request } from "../util/request";

interface ChannelInterface {
    id: string;
    name: string;
    displayName: string;
    language: string;
    gameId: string;
    gameName: string;
    title: string;
}

interface GameInterface {
    id: string;
    name: string;
    boxArtUrl: string;
}

const ChannelPage: React.FC = () => {
    const [title, updateTitle] = useState<string>("");
    const [gameId, updateGameId] = useState<string>("");
    const [gameName, updateGameName] = useState<string>("");
    const [gameBoxArtUrl, updateGameGoxArtUrl] = useState<string>("");

    useEffect(() => {
        (async () => {
            IsConnectingStore.dispatch({ type: "ENABLE" });

            const Channel = await request<
                { username: string },
                ChannelInterface | false
            >(
                "channel:info",
                { username: SettingChannelsStore.getState() },
                false
            );

            console.log(Channel);

            if (Channel) {
                updateTitle(Channel.title);
                updateGameId(Channel.gameId);
                updateGameName(Channel.gameName);

                const game = await request<
                    { gameId: string },
                    GameInterface | null
                >("channel:game", { gameId }, null);

                if (game) {
                    updateGameGoxArtUrl(game.boxArtUrl);
                }
            }

            IsConnectingStore.dispatch({ type: "DISABLE" });
        })();
    });

    const submitHandler = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <section className="my-4">
            <form onSubmit={submitHandler}>
                <h2>Channel Setting</h2>

                <div className="alert alert-info">
                    You can update Channel information.
                </div>

                <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                        Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        className="form-control form-control-lg"
                        value={title}
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="gameId" className="form-label">
                        Category
                    </label>

                    <div className="d-flex align-items-center">
                        {gameBoxArtUrl ? (
                            <figure className="me-2" style={{ width: "80px" }}>
                                <img
                                    src={gameBoxArtUrl
                                        .replace("{width}", "138")
                                        .replace("{height}", "190")}
                                    className="img-fluid"
                                    alt={gameName}
                                />
                            </figure>
                        ) : (
                            ""
                        )}
                        <span>{gameName}</span>
                    </div>

                    <input
                        type="text"
                        name="gameId"
                        id="gameId"
                        className="form-control"
                        value={gameName}
                    />
                </div>

                <button type="submit" className="btn btn-primary">
                    Submit
                </button>
            </form>
        </section>
    );
};

export default ChannelPage;
