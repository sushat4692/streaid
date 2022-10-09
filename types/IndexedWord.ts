import { DocumentExtends } from "./Document";

export type RequestIndexedWordType = {
    word: string;
    username: string;
    type: string;
    count: number;
};

export type IndexedWordType = DocumentExtends<RequestIndexedWordType>;
