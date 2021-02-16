import React, { useEffect, useState } from "react";
import { ChatUserstate } from "tmi.js";

// Store
import ChattersStore from "../store/Chatters";

// Component
import ChatterRowComponent from "../component/ChatterRowComponent";

const ChattersPage: React.FC = () => {
    const [chatters, updateChatters] = useState<ChatUserstate[]>(
        ChattersStore.getState()
    );

    useEffect(() => {
        ChattersStore.subscribe(() => {
            updateChatters([...ChattersStore.getState()]);
        });
    });

    return (
        <section className="mt-4">
            <h2>Chatters</h2>

            <table className="table">
                <colgroup>
                    <col />
                    <col />
                    <col width="130" />
                </colgroup>
                <thead>
                    <tr>
                        <th scope="col">Username</th>
                        <th scope="col">Displayname</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
                    {chatters.map((chatter) => {
                        return (
                            <ChatterRowComponent
                                chatter={chatter}
                                key={chatter.id}
                            ></ChatterRowComponent>
                        );
                    })}
                </tbody>
            </table>
        </section>
    );
};

export default ChattersPage;
