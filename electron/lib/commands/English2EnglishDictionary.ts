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
    word: string;
    wordtype: string;
    definition: string;
};

export const initialize = async () => {
    database = await open({
        filename: path.join(
            isDev ? "." : process.resourcesPath,
            "dict",
            "en2en.db"
        ),
        mode: sqlite3.OPEN_READONLY,
        driver: sqlite3.Database,
    });
};

export const getWordMeanEnToEn = async (
    UserState: ChatUserstate,
    word: string
) => {
    if (!database) {
        throw new Error("Not initialized");
    }

    const result = await database.all<DictionalyRow[]>(
        "SELECT * FROM entries WHERE word LIKE ?",
        [word]
    );

    if (!result.length) {
        return `Not found inputted word: ${word}`;
    }

    const count = await (async () => {
        const indexed = await findByWordIndexedWord({
            word,
            type: "e2e",
            username: UserState.username ?? "",
        });

        if (indexed) {
            indexed.count += 1;
            await updateCommmand(indexed._id, indexed);
            return indexed.count;
        } else {
            const indexed: RequestIndexedWordType = {
                word,
                type: "e2e",
                username: UserState.username ?? "",
                count: 1,
            };
            await pushIndexedWord(indexed);
            return indexed.count;
        }
    })();

    const description = result
        .map((r) => `[${r.wordtype}] ${r.definition}`)
        .join(" / ");

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
                description,
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

    return `${description} -- < searched this word ${count} time(s) >`;
};
