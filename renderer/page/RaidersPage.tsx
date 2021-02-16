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
    });

    return (
        <section className="mt-4">
            <h2>Raiders</h2>

            <table className="table">
                <colgroup>
                    <col />
                    <col />
                    <col width="100" />
                    <col width="160" />
                </colgroup>
                <thead>
                    <tr>
                        <th scope="col">Channel</th>
                        <th scope="col">Username</th>
                        <th scope="col">Viewers</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
                    {raiders.map((raider) => {
                        return (
                            <RaiderRowComponent
                                raider={raider}
                            ></RaiderRowComponent>
                        );
                    })}
                </tbody>
            </table>
        </section>
    );
};

export default ChattersPage;
