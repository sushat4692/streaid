import React, { useEffect, useState } from "react";

// Store
import ChattersStore, { ChatterRowType } from "../store/Chatters";

// Component
import ChatterRowComponent from "../component/ChatterRowComponent";

const ChattersPage: React.FC = () => {
    const [chatters, updateChatters] = useState<ChatterRowType[]>(
        ChattersStore.getState()
    );

    useEffect(() => {
        ChattersStore.subscribe(() => {
            updateChatters([...ChattersStore.getState()]);
        });
    });

    return (
        <section className="my-4">
            <h2>Chatters</h2>

            <div className="table-responsive">
                <table className="table">
                    <colgroup>
                        <col />
                        <col />
                        <col />
                        <col width="160" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th scope="col">Channel</th>
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
                                    key={chatter.userstate.id}
                                ></ChatterRowComponent>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default ChattersPage;
