import React, { useEffect } from "react";
import { useRecoilState } from "recoil";

// Recoil
import ChattersState, { ChatterRowType } from "../atom/Chatters";

// Component
import ChatterRowComponent from "../component/ChatterRow";

// Util
import { request } from "../util/request";

const ChattersPage: React.FC = () => {
    const [chatters, updateChatters] = useRecoilState(ChattersState);

    useEffect(() => {
        (async () => {
            const chatters = await request<{}, ChatterRowType[]>(
                "chatter",
                {},
                []
            );
            updateChatters([...chatters]);
        })();
    }, []);

    return (
        <section className="my-4">
            <h2 className="display-6 mb-3 fw-bolder">
                <i className="bi bi-chat me-2"></i>
                Chatters
            </h2>

            <div className="table-responsive">
                <table className="table">
                    <colgroup>
                        <col />
                        <col />
                        <col width="140" />
                        <col width="160" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th scope="col">Username</th>
                            <th scope="col">Displayname</th>
                            <th scope="col">Created</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {chatters.map((chatter) => {
                            return (
                                <ChatterRowComponent
                                    chatter={chatter}
                                    key={chatter._id}
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
