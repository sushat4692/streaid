import dbFactory from "./factory";

// Types
import { RequestIndexedWordType } from "../../types/IndexedWord";

const database = dbFactory("indexed_words.db");

export const pushIndexedWord = async (indexedWord: RequestIndexedWordType) => {
    await database.insert(indexedWord);
};

export const getIndexedWords = async () => {
    return await database
        .find<RequestIndexedWordType>({})
        .sort({ createdAt: -1 });
};

export const findIndexedWord = async (id: string) => {
    return await database.findOne<RequestIndexedWordType>({ _id: id });
};

export const findByWordIndexedWord = async (word: string) => {
    return await database.findOne<RequestIndexedWordType>({ word });
};

export const updateCommmand = async (
    id: string,
    indexedWord: RequestIndexedWordType
) => {
    await database.update({ _id: id }, indexedWord);
};

export const removeIndexedWord = async (id: string) => {
    await database.remove({ _id: id }, {});
};

export default database;
