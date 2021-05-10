export type Document = {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
};

export type DocumentExtends<T> = {
    [P in keyof T]: T[P];
} &
    Document;
