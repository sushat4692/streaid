import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

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
            const chatters = await request<null, ChatterRowType[]>(
                "chatter",
                null,
                []
            );
            updateChatters([...chatters]);
        })();
    }, []);

    return (
        <section className="my-4">
            <h2 className="display-6 mb-3 fw-bolder">
                <i className="bi bi-chat me-2"></i>
                <FormattedMessage
                    id="Common.Chatters.Name"
                    defaultMessage="Chatters"
                />
            </h2>

            <p className="lead">
                <FormattedMessage
                    id="Common.Chatters.Description"
                    defaultMessage="Display user list that comment to target channel."
                />
            </p>

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
                            <th scope="col">
                                <FormattedMessage
                                    id="Common.Label.Username"
                                    defaultMessage="Username"
                                />
                            </th>
                            <th scope="col">
                                <FormattedMessage
                                    id="Common.Label.Displayname"
                                    defaultMessage="Displayname"
                                />
                            </th>
                            <th scope="col">
                                <FormattedMessage
                                    id="Common.Label.Created"
                                    defaultMessage="Created"
                                />
                            </th>
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
