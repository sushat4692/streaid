import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import CommandsState from "../atom/Commands";

// Component
import MetaComponent from "../component/Meta";
import CommandRowComponent from "../component/CommandRow";
import CommandFormComponent from "../component/CommandForm";

// Util
import { request } from "../util/request";

const CommandPage: React.FC = () => {
    const [commands, updateCommands] = useRecoilState(CommandsState);

    useEffect(() => {
        (async () => {
            const commands = await request("command", {}, [
                {
                    _id: "1",
                    command: "Command1",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "broadcaster",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    command: "Command2",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "mod",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "3",
                    command: "Command3",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "vip",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "4",
                    command: "Command4",
                    body: "Command body Test",
                    memo: "Command memo",
                    allow: "everyone",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);

            updateCommands([...commands]);
        })();
    }, []);

    return (
        <>
            <MetaComponent id="Common.Command.Name" defaultMessage="Command" />

            <div className="page-header">
                <div className="container-fluid">
                    <h1 className="page-header__text">
                        <i className="bi bi-wrench page-header__icon" />
                        <FormattedMessage
                            id="Common.Command.Name"
                            defaultMessage="Command"
                        />
                    </h1>
                </div>
            </div>

            <div className="container-fluid">
                <section className="section">
                    <p className="section__lead">
                        <FormattedMessage
                            id="Common.Command.Description"
                            defaultMessage="You can manage your own channel command."
                        />
                    </p>

                    <div style={{ marginBottom: "10px" }}>
                        <CommandFormComponent />
                    </div>
                </section>

                <div className="table-responsive">
                    <table className="table">
                        <colgroup>
                            <col />
                            <col width="140" />
                            <col width="140" />
                            <col width="80" />
                        </colgroup>

                        <thead>
                            <tr>
                                <th scope="col">
                                    <FormattedMessage
                                        id="Common.Label.Command"
                                        defaultMessage="Command"
                                    />
                                </th>
                                <th scope="col">
                                    <FormattedMessage
                                        id="Common.Label.Priviledge"
                                        defaultMessage="Priviledge"
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
                            {commands.map((command) => {
                                return (
                                    <CommandRowComponent
                                        command={command}
                                        key={command._id}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default CommandPage;
