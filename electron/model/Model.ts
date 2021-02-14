import { Model } from "objection";
import knex from "knex";
import path from "path";
import isDev from "electron-is-dev";
import { existsSync, openSync, closeSync, mkdirsSync } from "fs-extra";
import { dirname } from "path";

const filename = isDev
    ? path.join(__dirname, "../db/prefs.db")
    : path.join(process.resourcesPath, "db/prefs.db");

if (!existsSync(filename)) {
    mkdirsSync(dirname(filename));
    closeSync(openSync(filename, "w"));
}

const Knex = knex({
    client: "sqlite3",
    connection: () => ({
        filename,
        debug: isDev,
    }),
});

Model.knex(Knex);

export default Model;
