import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import isDev from "electron-is-dev";
import { ChatUserstate } from "tmi.js";

import {
    findByWordIndexedWord,
    pushIndexedWord,
    updateCommmand,
} from "../../database/IndexedWord";
import { RequestIndexedWordType } from "../../../types/IndexedWord";
import axios, { AxiosError } from "axios";

// Store
import { getInstance as getStoreInstance } from "../../store";

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
            isDev ? "." : process.resourcesPath,
            "dict",
            "ejdict.sqlite3"
        ),
        mode: sqlite3.OPEN_READONLY,
        driver: sqlite3.Database,
    });
};

export const getWordMeanEnToJa = async (
    UserState: ChatUserstate,
    word: string
) => {
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
        const indexed = await findByWordIndexedWord({
            word,
            type: "e2j",
            username: UserState.username ?? "",
        });

        if (indexed) {
            indexed.count += 1;
            await updateCommmand(indexed._id, indexed);
            return indexed.count;
        } else {
            const indexed: RequestIndexedWordType = {
                word,
                type: "e2j",
                username: UserState.username ?? "",
                count: 1,
            };
            await pushIndexedWord(indexed);
            return indexed.count;
        }
    })();

    const data = {
        embeds: [
            {
                color:
                    count <= 1
                        ? parseInt("408558", 16)
                        : count >= 3
                        ? parseInt("CB444A", 16)
                        : parseInt("F6C344", 16),
                title: word,
                description: result.mean,
                footer: {
                    text: `searched this word ${count} time(s)`,
                },
            },
        ],
    };

    const store = getStoreInstance();
    const url = store.get("discord_webhook", "");
    if (url) {
        axios.post(url, data).catch((e: AxiosError) => {
            console.log(e);
        });
    }

    return `${result.mean} -- < searched this word ${count} time(s) >`;
};
