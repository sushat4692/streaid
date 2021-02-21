import React, { useEffect, useState } from "react";

// Store
import RaidersStore, { RaiderRowType } from "../store/Raiders";

// Component
import RaiderRowComponent from "../component/RaiderRowComponent";

const ChattersPage: React.FC = () => {
    const [raiders, updateRaiders] = useState<RaiderRowType[]>(
        RaidersStore.getState()
    );

    useEffect(() => {
        RaidersStore.subscribe(() => {
            updateRaiders([...RaidersStore.getState()]);
        });
    }, []);

    return (
        <section className="my-4">
            <h2>Raiders</h2>

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
                            <th scope="col">Username</th>
                            <th scope="col">Viewers</th>
                            <th scope="col">Created</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {raiders.map((raider) => {
                            return (
                                <RaiderRowComponent
                                    raider={raider}
                                    key={raider._id}
                                ></RaiderRowComponent>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default ChattersPage;
