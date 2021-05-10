import { DocumentExtends } from "./Document";

export type RequestUserMemoType = {
    username: string;
    nickname: string;
    memo: string;
};

export type UserMemoType = DocumentExtends<RequestUserMemoType>;
