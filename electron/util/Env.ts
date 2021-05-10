const values: { [key: string]: unknown } = {};

export const useEnv = () => {
    const get = (key: string) => {
        if (!values.hasOwnProperty(key)) {
            return null;
        }
        return values[key];
    };

    const set = (key: string, value: string) => {
        values[key] = value;
    };

    return {
        get,
        set,
    };
};
