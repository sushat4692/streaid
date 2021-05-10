import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import HostsState from "../atom/Hosts";
import LocaleState from "../atom/Locale";

// Component
import MetaComponent from "../component/Meta";
import HostRowComponent from "../component/HostRow";

// Util
import { request } from "../util/request";

const ChattersPage: React.FC = () => {
    const [hosts, updateHosts] = useRecoilState(HostsState);
    const locale = useRecoilValue(LocaleState);

    useEffect(() => {
        (async () => {
            const hosts = await request("host", null, [
                {
                    _id: "1",
                    channel: "channel",
                    username: "channel",
                    viewers: 1,
                    autohost: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    channel: "channel",
                    username: "channel",
                    viewers: 1,
                    autohost: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
            updateHosts([...hosts]);
        })();
    }, []);

    return (
        <>
            <MetaComponent id="Common.Hosts.Name" defaultMessage="Hosts" />

            <div className="page-header">
                <div className="container-fluid">
                    <h1 className="page-header__text">
                        <i className="bi bi-display page-header__icon" />
                        <FormattedMessage
                            id="Common.Hosts.Name"
                            defaultMessage="Hosts"
                        />
                    </h1>
                </div>
            </div>

            <div className="container-fluid">
                <section className="section">
                    <p className="section__lead">
                        <FormattedMessage
                            id="Common.Hosts.Description"
                            defaultMessage="Display user list that hosted to target channel."
                        />
                    </p>
                    <div className="table-responsive">
                        <table className="table">
                            <colgroup>
                                <col />
                                <col width="100" />
                                <col width="100" />
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
                                            id="Common.Label.Viewers"
                                            defaultMessage="Viewers"
                                        />
                                    </th>
                                    <th scope="col">
                                        <FormattedMessage
                                            id="Common.Label.Autoloaded"
                                            defaultMessage="Autoloaded"
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
                                {hosts.map((host) => {
                                    return (
                                        <HostRowComponent
                                            host={host}
                                            key={host._id}
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
