import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import HostsState, { HostRowType } from "../atom/Hosts";

// Component
import MetaComponent from "../component/Meta";
import HostRowComponent from "../component/HostRow";

// Util
import { request } from "../util/request";

const ChattersPage: React.FC = () => {
    const [hosts, updateHosts] = useRecoilState(HostsState);

    useEffect(() => {
        (async () => {
            const hosts = await request<null, HostRowType[]>("host", null, []);
            updateHosts([...hosts]);
        })();
    }, []);

    return (
        <section className="my-4">
            <MetaComponent id="Common.Hosts.Name" defaultMessage="Hosts" />

            <h2 className="display-6 mb-3 fw-bolder">
                <i className="bi bi-display me-2"></i>
                <FormattedMessage
                    id="Common.Hosts.Name"
                    defaultMessage="Hosts"
                />
            </h2>

            <p className="lead">
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
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {hosts.map((host) => {
                            return (
                                <HostRowComponent
                                    host={host}
                                    key={host._id}
                                ></HostRowComponent>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default ChattersPage;
