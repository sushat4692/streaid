import { ipcMain } from "electron";
import { RequestUserMemoType } from "../../types/UserMemo";

import {
    storeUserMemo,
    getUserMemos,
    getUserMemoByUsername,
    removeUserMemo,
} from "../database/UserMemo";

ipcMain.handle("usermemo", async () => {
    return await getUserMemos();
});

ipcMain.handle("usermemo:one", async (_, username: string) => {
    return await getUserMemoByUsername(username);
});

ipcMain.handle("usermemo:store", async (_, userMemo: RequestUserMemoType) => {
    await storeUserMemo(userMemo);
    return await getUserMemos();
});

ipcMain.handle("usermemo:delete", async (_, id: string) => {
    await removeUserMemo(id);
    return await getUserMemos();
});
