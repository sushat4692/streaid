import { ipcMain } from "electron";

import {
    storeUserMemo,
    getUserMemos,
    getUserMemoByUsername,
    removeUserMemo,
    UserMemoInformation,
} from "../database/UserMemo";

ipcMain.handle("usermemo", async () => {
    return await getUserMemos();
});

ipcMain.handle("usermemo:one", async (_, username: string) => {
    return await getUserMemoByUsername(username);
});

ipcMain.handle("usermemo:store", async (_, userMemo: UserMemoInformation) => {
    await storeUserMemo(userMemo);
    return await getUserMemos();
});

ipcMain.handle("usermemo:delete", async (_, values) => {
    await removeUserMemo(values.id);
    return await getUserMemos();
});
