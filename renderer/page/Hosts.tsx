import React, { useEffect, useState } from "react";

// Store
import { getState, subscribe, HostRowType } from "../store/Hosts";

// Component
import HostRowComponent from "../component/HostRow";

const ChattersPage: React.FC = () => {
    const [hosts, updateHosts] = useState<HostRowType[]>(getState());

    useEffect(() => {
        subscribe(() => {
            updateHosts([...getState()]);
        });
    }, []);

    return (
        <section className="my-4">
            <h2 className="display-6 mb-3 fw-bolder">
                <i className="bi bi-display me-2"></i>
                Hosts
            </h2>

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
                            <th scope="col">Username</th>
                            <th scope="col">Viewers</th>
                            <th scope="col">Autoloaded</th>
                            <th scope="col">Created</th>
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
