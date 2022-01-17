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
    source: number;
    id: number;
    kanji: string;
    reading: string;
    furigana: string;
    pri_point: number;
    meaning: string;
    tags: string;
};

export const initialize = async () => {
    database = await open({
        filename: path.join(
            isDev ? "." : process.resourcesPath,
            "dict",
            "japanese.db"
        ),
        mode: sqlite3.OPEN_READONLY,
        driver: sqlite3.Database,
    });
};

export const getWordMeanJaToEn = async (
    UserState: ChatUserstate,
    word: string
) => {
    if (!database) {
        throw new Error("Not initialized");
    }

    const [result, resultWord] = await (async () => {
        const wordFullWidth = word.replace(/[A-Za-z0-9!-~]/g, function (s) {
            return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
        });

        const result = await database.get<DictionalyRow>(
            "SELECT * FROM dict_index WHERE kanji = ? OR reading = ? ORDER BY pri_point DESC LIMIT 1",
            [word, word]
        );

        if (result) {
            return [result, word];
        }

        return [
            await database.get<DictionalyRow>(
                "SELECT * FROM dict_index WHERE kanji = ? OR reading = ? ORDER BY pri_point DESC LIMIT 1",
                [wordFullWidth, wordFullWidth]
            ),
            wordFullWidth,
        ];
    })();

    if (!result) {
        return `Not found inputted word: ${word}`;
    }

    const count = await (async () => {
        const indexed = await findByWordIndexedWord({
            word: resultWord,
            username: UserState.username ?? "",
        });

        if (indexed) {
            indexed.count += 1;
            await updateCommmand(indexed._id, indexed);
            return indexed.count;
        } else {
            const indexed: RequestIndexedWordType = {
                word: resultWord,
                username: UserState.username ?? "",
                count: 1,
            };
            await pushIndexedWord(indexed);
            return indexed.count;
        }
    })();

    // const data = {
    //     embeds: [
    //         {
    //             color:
    //                 count <= 1
    //                     ? parseInt("408558", 16)
    //                     : count >= 3
    //                     ? parseInt("CB444A", 16)
    //                     : parseInt("F6C344", 16),
    //             title: word,
    //             description: result.meaning,
    //             footer: {
    //                 text: `searched this word ${count} time(s)`,
    //             },
    //         },
    //     ],
    // };

    // const store = getStoreInstance();
    // const url = store.get("discord_webhook", "");
    // if (url) {
    //     axios.post(url, data).catch((e: AxiosError) => {
    //         console.log(e);
    //     });
    // }

    return `${result.meaning} -- < searched this word ${count} time(s) >`;
};
