import { DocumentExtends } from "./Document";

export type RequestIndexedWordType = {
    word: string;
    count: number;
};

export type IndexedWordType = DocumentExtends<RequestIndexedWordType>;
