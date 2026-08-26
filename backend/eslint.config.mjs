// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "src/generated/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/interface-name-prefix": "off",
    },
  },

  {
    // Test doubles are deliberately loosely typed (`let prisma: any = {...}`)
    // rather than reimplementing PrismaService's full generated type per
    // test — the strict any/unsafe-* rules below exist for production code,
    // not mocks.
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },

  {
    // Root-level config/one-off files sit outside tsconfig.eslint.json's
    // project, so type-aware parsing cannot resolve them. Lint them without
    // type information instead of leaving them as parse errors.
    files: ["*.mjs", "*.js", "_*.ts"],
    languageOptions: {
      parserOptions: { project: null, projectService: false },
    },
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      // `_*.ts` are throwaway harnesses that monkey-patch third-party
      // prototypes (pg's Pool.query) to inject failures — that cannot be done
      // without `any`, and none of it ships.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  prettierConfig,
);
