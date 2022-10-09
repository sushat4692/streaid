const values: { [key: string]: unknown } = {};

export const useEnv = () => {
    const get = <T = unknown>(key: string): T | null => {
        if (!values.hasOwnProperty(key)) {
            return null;
        }
        return values[key] as T;
    };

    const set = (key: string, value: unknown) => {
        values[key] = value;
    };

    return {
        get,
        set,
    };
};
