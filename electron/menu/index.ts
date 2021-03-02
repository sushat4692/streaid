import { Menu } from "electron";

import enUsTemplate from "./en-us";
import jaJpTemplate from "./ja-jp";

export const setMenu = (locale: string) => {
    const template = (() => {
        switch (locale) {
            case "ja-jp":
                return jaJpTemplate;
            case "en-us":
            default:
                return enUsTemplate;
        }
    })();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};
