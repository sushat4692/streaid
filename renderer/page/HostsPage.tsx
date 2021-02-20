import React, { useEffect, useState } from "react";

// Store
import HostsStore, { HostRowType } from "../store/Hosts";

// Component
import HostRowComponent from "../component/HostRowComponent";

const ChattersPage: React.FC = () => {
    const [hosts, updateHosts] = useState<HostRowType[]>(HostsStore.getState());

    useEffect(() => {
        HostsStore.subscribe(() => {
            updateHosts([...HostsStore.getState()]);
        });
    }, []);

    return (
        <section className="my-4">
            <h2>Hosts</h2>

            <div className="table-responsive">
                <table className="table">
                    <colgroup>
                        <col />
                        <col />
                        <col width="100" />
                        <col width="100" />
                        <col width="160" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th scope="col">Channel</th>
                            <th scope="col">Username</th>
                            <th scope="col">Viewers</th>
                            <th scope="col">Autoloaded</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {hosts.map((host) => {
                            return (
                                <HostRowComponent
                                    host={host}
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
