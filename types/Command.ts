import { DocumentExtends } from "./Document";
import { CommandAllowType } from "./CommandAllow";

export type RequestCommandType = {
    command: string;
    body: string;
    memo: string;
    allow: CommandAllowType;
};

export type CommandType = DocumentExtends<RequestCommandType>;
