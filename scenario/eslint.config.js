const base = require("../eslint.config");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
    {
        files: ["test/"],
    },
    ...base,
    {
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: __dirname,
            },
        },
    },
);
