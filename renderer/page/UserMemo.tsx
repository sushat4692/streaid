import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { FormattedMessage } from "react-intl";

// Recoil
import UserMemoState from "../atom/UserMemo";
import LocaleState from "../atom/Locale";

// Component
import MetaComponent from "../component/Meta";
import UserMemoRowComponent from "../component/UserMemoRow";

// Util
import { request } from "../util/request";

const UserMemoPage: React.FC = () => {
    const [userMemos, updateUserMemos] = useRecoilState(UserMemoState);
    const locale = useRecoilValue(LocaleState);

    useEffect(() => {
        (async () => {
            const memos = await request("usermemo", null, [
                {
                    _id: "1",
                    username: "username",
                    nickname: "nickname",
                    memo: "memo",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    _id: "2",
                    username: "username",
                    nickname: "nickname",
                    memo: "memo",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);

            updateUserMemos(memos);
        })();
    }, []);

    return (
        <>
            <MetaComponent
                id="Common.UserMemo.Name"
                defaultMessage="User memo"
            />

            <div className="page-header">
                <div className="container-fluid">
                    <h1 className="page-header__text">
                        <i className="bi bi-people page-header__icon" />
                        <FormattedMessage
                            id="Common.UserMemo.Name"
                            defaultMessage="User memo"
                        />
                    </h1>
                </div>
            </div>

            <div className="container-fluid">
                <section className="section">
                    <p className="section__lead">
                        <FormattedMessage
                            id="Common.UserMemo.Description"
                            defaultMessage="You can store the target additional information."
                        />
                    </p>

                    <div className="table-responsive">
                        <table className="table">
                            <colgroup>
                                <col />
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
                                            id="Common.Label.Created"
                                            defaultMessage="Created"
                                        />
                                    </th>
                                    <th scope="col" />
                                </tr>
                            </thead>
                            <tbody>
                                {userMemos.map((usermemo) => {
                                    return (
                                        <UserMemoRowComponent
                                            usermemo={usermemo}
                                            key={usermemo._id}
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

export default UserMemoPage;
