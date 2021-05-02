import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import ChattersState, { ChatterRowType } from "../atom/Chatters";
import LocaleState from "../atom/Locale";

// Component
import MetaComponent from "../component/Meta";
import ChatterRowComponent from "../component/ChatterRow";

// Util
import { request } from "../util/request";

const ChattersPage: React.FC = () => {
    const [chatters, updateChatters] = useRecoilState(ChattersState);
    const locale = useRecoilValue(LocaleState);

    useEffect(() => {
        (async () => {
            const chatters = await request<null, ChatterRowType[]>(
                "chatter",
                null,
                [
                    {
                        _id: "1",
                        "message-type": "chat",
                        username: "username",
                        "display-name": "displayname",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        _id: "2",
                        "message-type": "chat",
                        username: "username",
                        "display-name": "displayname",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ]
            );
            updateChatters([...chatters]);
        })();
    }, []);

    return (
        <>
            <MetaComponent
                id="Common.Chatters.Name"
                defaultMessage="Chatters"
            />

            <div className="page-header">
                <div className="container-fluid">
                    <h1 className="page-header__text">
                        <i className="bi bi-chat page-header__icon" />
                        <FormattedMessage
                            id="Common.Chatters.Name"
                            defaultMessage="Chatters"
                        />
                    </h1>
                </div>
            </div>

            <div className="container-fluid">
                <section className="section">
                    <p className="section__lead">
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
                                <col width={locale === "ja-jp" ? 180 : 160} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Username"
                                            defaultMessage="Username"
                                        />
                                        /
                                        <FormattedMessage
                                            id="Common.Label.NickName"
                                            defaultMessage="Nick name"
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
                                    <th scope="col" />
                                </tr>
                            </thead>
                            <tbody>
                                {chatters.map((chatter) => {
                                    return (
                                        <ChatterRowComponent
                                            chatter={chatter}
                                            key={chatter._id}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
};

export default ChattersPage;
