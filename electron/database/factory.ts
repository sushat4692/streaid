import { app } from "electron";
import Database from "nedb-promises";
import isDev from "electron-is-dev";

const dbFactory = (fileName, isOnMemory = false) =>
    Database.create({
        filename: `${isDev ? "." : app.getAppPath()}/data/${fileName}`,
        timestampData: true,
        autoload: true,
        inMemoryOnly: isOnMemory,
    });

export default dbFactory;
