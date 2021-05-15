import { app } from "electron";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import isDev from "electron-is-dev";

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

    return result.mean;
};
