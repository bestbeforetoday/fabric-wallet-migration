import base from "../eslint.config.mjs";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        files: ["test/"],
    },
    ...base,
    {
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
