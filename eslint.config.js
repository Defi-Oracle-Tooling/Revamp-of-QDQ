// ESLint v9 configuration file
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsdoc from "eslint-plugin-jsdoc";

export default [
    {
        files: ["src/**/*.ts", "tests/**/*.ts"],
        plugins: {
            "@typescript-eslint": typescriptEslint,
            "jsdoc": jsdoc,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                sourceType: "module",
            },
        },
        rules: {
            // Core TypeScript rules
            "@typescript-eslint/adjacent-overload-signatures": "error",
            "@typescript-eslint/array-type": ["error", { "default": "array" }],
            "@typescript-eslint/ban-types": [
                "error",
                {
                    "types": {
                        "Object": { "message": "Avoid using the `Object` type. Did you mean `object`?" },
                        "Function": { "message": "Avoid using the `Function` type. Prefer a specific function type." },
                        "Boolean": { "message": "Avoid using the `Boolean` type. Did you mean `boolean`?" },
                        "Number": { "message": "Avoid using the `Number` type. Did you mean `number`?" },
                        "String": { "message": "Avoid using the `String` type. Did you mean `string`?" },
                        "Symbol": { "message": "Avoid using the `Symbol` type. Did you mean `symbol`?" }
                    }
                }
            ],
            "@typescript-eslint/consistent-type-assertions": "error",
            "@typescript-eslint/dot-notation": "error",
            "@typescript-eslint/member-delimiter-style": [
                "error",
                {
                    "multiline": { "delimiter": "semi", "requireLast": true },
                    "singleline": { "delimiter": "semi", "requireLast": false }
                }
            ],
            "@typescript-eslint/no-empty-function": "error",
            "@typescript-eslint/no-empty-interface": "error",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-misused-new": "error",
            "@typescript-eslint/no-namespace": "error",
            "@typescript-eslint/no-unused-expressions": "error",
            "@typescript-eslint/no-var-requires": "error",
            "@typescript-eslint/prefer-for-of": "error",
            "@typescript-eslint/prefer-function-type": "error",
            "@typescript-eslint/prefer-namespace-keyword": "error",
            "@typescript-eslint/semi": ["error", "always"],
            "@typescript-eslint/triple-slash-reference": [
                "error",
                { "path": "always", "types": "prefer-import", "lib": "always" }
            ],
            "@typescript-eslint/unified-signatures": "error",

            // General rules
            "camelcase": "error",
            "constructor-super": "error",
            "eqeqeq": ["error", "smart"],
            "guard-for-in": "error",
            "id-match": "error",
            "max-classes-per-file": ["error", 1],
            "max-len": ["error", { "code": 240 }],
            "new-parens": "error",
            "no-bitwise": "error",
            "no-caller": "error",
            "no-cond-assign": "error",
            "no-console": "off",
            "no-debugger": "error",
            "no-empty": "error",
            "no-eval": "error",
            "no-fallthrough": "off",
            "no-new-wrappers": "error",
            "no-shadow": ["error", { "hoist": "all" }],
            "no-throw-literal": "error",
            "no-trailing-spaces": "error",
            "no-undef-init": "error",
            "no-unsafe-finally": "error",
            "no-unused-labels": "error",
            "no-var": "error",
            "object-shorthand": "error",
            "one-var": ["error", "never"],
            "prefer-const": "error",
            "radix": "error",
            "spaced-comment": ["error", "always", { "markers": ["/"] }],
            "use-isnan": "error",

            // JSDoc rules
            "jsdoc/check-alignment": "error",
            "jsdoc/check-indentation": "error",
            "jsdoc/newline-after-description": "error",
        },
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                module: "readonly",
                require: "readonly",
                process: "readonly",
                console: "readonly",
                __dirname: "readonly",
            },
        },
    },
];