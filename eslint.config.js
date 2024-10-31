const jest = require("eslint-plugin-jest");
const js = require("@eslint/js");
const prettier = require("eslint-config-prettier");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
    {
        ignores: ["*", "!src/", "!test/"],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    prettier,
    jest.configs["flat/recommended"],
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                project: "tsconfig.json",
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            complexity: ["error", 10],
            "@typescript-eslint/explicit-function-return-type": [
                "error",
                {
                    allowExpressions: true,
                },
            ],
        },
    },
);
