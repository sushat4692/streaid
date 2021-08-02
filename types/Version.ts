import { VersionHistory } from "./VersionHistory";

export type Version = {
    latest: string;
    history: VersionHistory[];
};
