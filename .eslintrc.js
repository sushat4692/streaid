module.exports = {
    env: {
        browser: false,
        node: true,
        es6: false,
    },
    parserOptions: {
        parser: "@typescript-eslint/parser",
        sourceType: "module",
    },
    extends: [
        "plugin:vue/essential",
        "@vue/prettier",
        "@vue/typescript",
        "eslint:recommended",
        "plugin:prettier/recommended",
    ],
    plugins: ["@typescript-eslint"],
    globals: {
        window: true,
        document: true,
    },
    rules: {
        "no-unused-variable": 0,
        "no-unused-vars": 0,
        "no-prototype-builtins": 0,
        "require-atomic-updates": 0,
        "@typescript-eslint/no-unused-vars": [
            2,
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
    },
};
