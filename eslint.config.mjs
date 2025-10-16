// ESLint v9 configuration file (renamed to .mjs to avoid Node typeless warning)
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      jsdoc: jsdoc,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
    rules: {
      "@typescript-eslint/adjacent-overload-signatures": "error",
      "@typescript-eslint/array-type": ["error", { default: "array" }],
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/dot-notation": "error",
      camelcase: "error",
      "constructor-super": "error",
      eqeqeq: ["error", "smart"],
      "guard-for-in": "error",
      "id-match": "error",
      "max-classes-per-file": ["error", 1],
      "max-len": ["error", { code: 240 }],
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
      "no-shadow": ["error", { hoist: "all" }],
      "no-throw-literal": "error",
      "no-trailing-spaces": "error",
      "no-undef-init": "error",
      "no-unsafe-finally": "error",
      "no-unused-labels": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "one-var": ["error", "never"],
      "prefer-const": "error",
      radix: "error",
      "spaced-comment": ["error", "always", { markers: ["/"] }],
      "use-isnan": "error",
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
