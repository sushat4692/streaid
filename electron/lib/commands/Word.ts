import { app } from "electron";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import isDev from "electron-is-dev";

import {
    findByWordIndexedWord,
    pushIndexedWord,
    updateCommmand,
} from "../../database/IndexedWord";
import { RequestIndexedWordType } from "../../../types/IndexedWord";

let database: Database<sqlite3.Database, sqlite3.Statement>;

type DictionalyRow = {
    item_id: number;
    word: string;
    mean: string;
    level: number;
};

export const initialize = async () => {
    database = await open({
        filename: path.join(
            isDev ? "." : app.getPath("userData"),
            "dict",
            "ejdict.sqlite3"
        ),
        mode: sqlite3.OPEN_READONLY,
        driver: sqlite3.Database,
    });
};

export const getWordMeanEnToJa = async (word: string) => {
    if (!database) {
        throw new Error("Not initialized");
    }

    const result = await database.get<DictionalyRow>(
        "SELECT * FROM items WHERE word = ? LIMIT 1",
        [word]
    );

    if (!result) {
        return `Not found inputted word: ${word}`;
    }

    const count = await (async () => {
        const indexed = await findByWordIndexedWord(word);

        if (indexed) {
            indexed.count += 1;
            await updateCommmand(indexed._id, indexed);
            return indexed.count;
        } else {
            const indexed: RequestIndexedWordType = {
                word,
                count: 1,
            };
            await pushIndexedWord(indexed);
            return indexed.count;
        }
    })();

    return `${result.mean} -- < searched this word ${count} time(s) >`;
};
