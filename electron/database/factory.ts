import { app } from "electron";
import Database from "nedb-promises";
import isDev from "electron-is-dev";

const dbFactory = (fileName) =>
    Database.create({
        filename: `${isDev ? "." : app.getAppPath()}/data/${fileName}`,
        timestampData: true,
        autoload: true,
    });

export default dbFactory;
