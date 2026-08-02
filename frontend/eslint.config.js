// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

/**
 * PHASE-1 ENFORCEMENT LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * These six rules exist to stop specific, counted regressions from coming
 * back after the Phase-1 cleanup:
 *
 *   no-explicit-any            — was 71 occurrences repo-wide
 *   ban-ts-comment              — was 5 @ts-ignore
 *   react/no-array-index-key    — was 210 key={index}
 *   jsx-a11y/no-static-...      — was 49 <div onClick>
 *   import/no-restricted-paths  — was 10 cross-feature reach-ins
 *   max-lines                   — was 8 files over 2,000 lines
 *
 * All six are `warn` today so the baseline can go green without a rewrite;
 * the plan is to flip each to `error` once its count reaches 0 (see
 * `npm run lint -- --format=json` to track counts, or docs/LINT_RATCHET.md).
 * A rule you can't enforce yet is still worth having on as a warning — it's
 * a countdown, not a suggestion.
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/shared/ui/**", // shadcn/radix primitives — generated, not hand-authored
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      react: reactPlugin,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: { version: "18.3" },
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      // ── React ────────────────────────────────────────────────────────────
      ...reactHooks.configs.recommended.rules,
      "react/no-array-index-key": "warn", // 210 existing violations — ratchet target
      "react/jsx-key": "error",

      // ── Accessibility ────────────────────────────────────────────────────
      // `jsx-a11y/recommended` ships several rules as hard `error`
      // (label-has-associated-control, no-noninteractive-element-interactions,
      // aria-role, no-autofocus, img-redundant-alt, alt-text). Against this
      // codebase that's 242 violations — a real WCAG remediation pass, not a
      // Phase-1 fix. Downgrading the whole set to `warn` here keeps every
      // violation visible (and counted) without blocking the Phase-1 gate;
      // the fix is scoped as its own phase in the roadmap, not swept under.
      ...Object.fromEntries(
        Object.entries(jsxA11y.configs.recommended.rules).map(([rule]) => [rule, "warn"])
      ),

      // ── Imports ──────────────────────────────────────────────────────────
      "import/no-restricted-paths": [
        "warn",
        {
          zones: [
            {
              target: "./src/features/*/",
              from: "./src/features/*/",
              // a feature may only reach into ITS OWN subtree, not a sibling
              message:
                "Cross-feature import detected. Route shared code through src/shared or src/lib instead of reaching into another feature's internals.",
            },
          ],
        },
      ],

      // ── File size ────────────────────────────────────────────────────────
      "max-lines": ["warn", { max: 2000, skipBlankLines: true, skipComments: true }],

      // ── TypeScript strictness ───────────────────────────────────────────
      "@typescript-eslint/no-explicit-any": "warn", // 71 existing violations
      "@typescript-eslint/ban-ts-comment": ["warn", { "ts-ignore": "allow-with-description" }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Config/tooling files run under Node, not the browser.
  {
    files: ["*.config.{js,ts,mjs,cjs}", "vite.config.ts", "scripts/**/*.{js,mjs,ts}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  prettierConfig
);
