import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import RaidersState, { RaiderRowType } from "../atom/Raiders";

// Component
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
                []
            );
            updateRaiders([...raiders]);
        })();
    }, []);

    return (
        <section className="my-4">
            <h2 className="display-6 mb-3 fw-bolder">
                <i className="bi bi-tornado me-2"></i>
                <FormattedMessage
                    id="Common.Raiders.Name"
                    defaultMessage="Raiders"
                />
            </h2>

            <p className="lead">
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
