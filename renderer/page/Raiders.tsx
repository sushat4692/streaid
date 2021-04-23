import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import RaidersState, { RaiderRowType } from "../atom/Raiders";

// Component
import MetaComponent from "../component/Meta";
import RaiderRowComponent from "../component/RaiderRow";

// Util
import { request } from "../util/request";

const ChattersPage: React.FC = () => {
    const [raiders, updateRaiders] = useRecoilState(RaidersState);

    useEffect(() => {
        (async () => {
            const raiders = await request<null, RaiderRowType[]>(
                "raider",
                null,
                [
                    {
                        _id: "1",
                        channel: "channel",
                        username: "username",
                        viewers: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        _id: "2",
                        channel: "channel",
                        username: "username",
                        viewers: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ]
            );
            updateRaiders([...raiders]);
        })();
    }, []);

    return (
        <>
            <MetaComponent id="Common.Raiders.Name" defaultMessage="Raiders" />

            <div className="page-header">
                <div className="container-fluid">
                    <h1 className="page-header__text">
                        <i className="bi bi-tornado page-header__icon" />
                        <FormattedMessage
                            id="Common.Raiders.Name"
                            defaultMessage="Raiders"
                        />
                    </h1>
                </div>
            </div>

            <div className="container-fluid">
                <section className="section">
                    <p className="section__lead">
                        <FormattedMessage
                            id="Common.Raiders.Description"
                            defaultMessage="Display user list that raided to target channel."
                        />
                    </p>

                    <div className="table-responsive">
                        <table className="table">
                            <colgroup>
                                <col />
                                <col width="100" />
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
                                        /
                                        <FormattedMessage
                                            id="Common.Label.NickName"
                                            defaultMessage="Nick name"
                                        />
                                    </th>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Viewers"
                                            defaultMessage="Viewers"
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
                                {raiders.map((raider) => {
                                    return (
                                        <RaiderRowComponent
                                            raider={raider}
                                            key={raider._id}
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
