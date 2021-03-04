import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import UserMemoState, { UserMemoRowType } from "../atom/UserMemo";

// Component
import MetaComponent from "../component/Meta";
import UserMemoRowComponent from "../component/UserMemoRow";

// Util
import { request } from "../util/request";

const UserMemoPage: React.FC = () => {
    const [userMemos, updateUserMemos] = useRecoilState(UserMemoState);

    useEffect(() => {
        (async () => {
            const memos = await request<null, UserMemoRowType[]>(
                "usermemo",
                null,
                []
            );

            updateUserMemos(memos);
        })();
    }, []);

    return (
        <section className="my-4">
            <MetaComponent
                id="Common.UserMemo.Name"
                defaultMessage="User memo"
            />

            <h2 className="display-6 mb-3 fw-bolder">
                <i className="bi bi-people me-2"></i>
                <FormattedMessage
                    id="Common.UserMemo.Name"
                    defaultMessage="User memo"
                />
            </h2>

            <p className="lead">
                <FormattedMessage
                    id="Common.UserMemo.Description"
                    defaultMessage="You can store the target additional information."
                />
            </p>

            <div className="table-responsive">
                <table className="table">
                    <colgroup>
                        <col />
                        <col />
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
                                    id="Common.Label.NickName"
                                    defaultMessage="Nick name"
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
                        {userMemos.map((usermemo) => {
                            return (
                                <UserMemoRowComponent
                                    usermemo={usermemo}
                                    key={usermemo._id}
                                ></UserMemoRowComponent>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default UserMemoPage;
