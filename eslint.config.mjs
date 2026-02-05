import globals from "globals";
import pluginJs from "@eslint/js";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default [
    {
        ignores: ["dist", "node_modules", "coverage", "**/*.js"],
    },
    // ESLint JS Recommended
    pluginJs.configs.recommended,

    // Custom Setup for TypeScript using the plugin and parser directly
    // (since we are not using the unified 'typescript-eslint' package)
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            "@typescript-eslint": typescriptEslintPlugin,
        },
        languageOptions: {
            parser: typescriptEslintParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
            },
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // Include rules from the recommended config manually or by spreading if they are in 'rules' property
            // We use 'flat/recommended' which might be an array or object. 
            // Since we can't easily spread an array into a rules object, we'll try to use the flat config exported by the plugin if possible.
            // However, to be safe and explicit given the split packages:

            // ...typescriptEslintPlugin.configs.recommended.rules // This is legacy format usually

            // Let's rely on manual setting + what we can get.
            // Actually, best practice with split packages in Flat Config is to just specific the config objects in the array.
        },
    },

    // Spread the flat/recommended config from the plugin
    // This will apply to files defined inside that config (usually *.ts, *.tsx, etc.)
    ...typescriptEslintPlugin.configs['flat/recommended'],

    // Overrides
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_"
                }
            ]
        }
    },

    // Prettier (must be last)
    prettierRecommended,
];
