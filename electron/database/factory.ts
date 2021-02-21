import { app } from "electron";
import Database from "nedb-promises";
import isDev from "electron-is-dev";
import path from "path";

const dbFactory = (fileName, isOnMemory = false) =>
    Database.create({
        filename: path.join(
            isDev ? "." : app.getPath("userData"),
            `data/${fileName}`
        ),
        timestampData: true,
        autoload: true,
        inMemoryOnly: isOnMemory,
    });

export default dbFactory;
