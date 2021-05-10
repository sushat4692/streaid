import React from "react";
import { useSetRecoilState } from "recoil";
import moment from "moment";

// Types
import { ChatterType } from "../../types/Chatter";

// Recoil
import ChattersState from "../atom/Chatters";

// Utility
import { request } from "../util/request";

// Component
import UserComponent from "./User";
import ShoutOutButtonComponent from "./ShoutOutButton";

type Props = {
    chatter: ChatterType;
};

const ChatterRowComponent: React.FC<Props> = ({ chatter }: Props) => {
    const updateChatters = useSetRecoilState(ChattersState);

    const deleteClickHandler = async () => {
        const chatters = await request("chatter:delete", chatter._id, []);

        updateChatters([...chatters]);
    };

    return (
        <tr>
            <td scope="row">
                <UserComponent username={chatter.username} />
            </td>
            <td>{chatter["display-name"]}</td>
            <td>{moment(chatter.createdAt).format("M/D kk:mm")}</td>
            <td>
                <div className="btn-group">
                    <ShoutOutButtonComponent
                        className="btn is-small btn-success"
                        username={chatter.username}
                    />
                    <button
                        className="btn is-small is-danger"
                        onClick={deleteClickHandler}
                    >
                        <i className="bi bi-trash" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ChatterRowComponent;
