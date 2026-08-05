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
      // BK Loom design-system Phase 3 (design-system/03-PRIMITIVES.md, Step 1 /
      // design-system/08-GOVERNANCE.md, Part D.1): only the retired, unreachable
      // shadcn/radix files are excluded now. Everything else under shared/ui/
      // (PageShell, the hand-authored primitives being built here, the existing
      // custom components) is real, imported code and must be linted like any
      // other source file.
      "src/shared/ui/_legacy/**",
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
          // Per-feature zones: files under a feature (target) may not deep-import
          // another feature's internals (from) — only its barrel (index.ts) is a
          // clean import. `!(X)` excludes the feature's own subtree so intra-feature
          // imports are unaffected. Generated for all features under src/features/.
          zones: [
            {
              target: "./src/features/audit/**",
              from: [
                "./src/features/!(audit)/components/**",
                "./src/features/!(audit)/contexts/**",
                "./src/features/!(audit)/data/**",
                "./src/features/!(audit)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/auth/**",
              from: [
                "./src/features/!(auth)/components/**",
                "./src/features/!(auth)/contexts/**",
                "./src/features/!(auth)/data/**",
                "./src/features/!(auth)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/bulk-orders/**",
              from: [
                "./src/features/!(bulk-orders)/components/**",
                "./src/features/!(bulk-orders)/contexts/**",
                "./src/features/!(bulk-orders)/data/**",
                "./src/features/!(bulk-orders)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/customers/**",
              from: [
                "./src/features/!(customers)/components/**",
                "./src/features/!(customers)/contexts/**",
                "./src/features/!(customers)/data/**",
                "./src/features/!(customers)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/dashboards/**",
              from: [
                "./src/features/!(dashboards)/components/**",
                "./src/features/!(dashboards)/contexts/**",
                "./src/features/!(dashboards)/data/**",
                "./src/features/!(dashboards)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/design-library/**",
              from: [
                "./src/features/!(design-library)/components/**",
                "./src/features/!(design-library)/contexts/**",
                "./src/features/!(design-library)/data/**",
                "./src/features/!(design-library)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/finishing/**",
              from: [
                "./src/features/!(finishing)/components/**",
                "./src/features/!(finishing)/contexts/**",
                "./src/features/!(finishing)/data/**",
                "./src/features/!(finishing)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/firms/**",
              from: [
                "./src/features/!(firms)/components/**",
                "./src/features/!(firms)/contexts/**",
                "./src/features/!(firms)/data/**",
                "./src/features/!(firms)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/inventory/**",
              from: [
                "./src/features/!(inventory)/components/**",
                "./src/features/!(inventory)/contexts/**",
                "./src/features/!(inventory)/data/**",
                "./src/features/!(inventory)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/materials/**",
              from: [
                "./src/features/!(materials)/components/**",
                "./src/features/!(materials)/contexts/**",
                "./src/features/!(materials)/data/**",
                "./src/features/!(materials)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/notifications/**",
              from: [
                "./src/features/!(notifications)/components/**",
                "./src/features/!(notifications)/contexts/**",
                "./src/features/!(notifications)/data/**",
                "./src/features/!(notifications)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/payments/**",
              from: [
                "./src/features/!(payments)/components/**",
                "./src/features/!(payments)/contexts/**",
                "./src/features/!(payments)/data/**",
                "./src/features/!(payments)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/portals/**",
              from: [
                "./src/features/!(portals)/components/**",
                "./src/features/!(portals)/contexts/**",
                "./src/features/!(portals)/data/**",
                "./src/features/!(portals)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/pricing/**",
              from: [
                "./src/features/!(pricing)/components/**",
                "./src/features/!(pricing)/contexts/**",
                "./src/features/!(pricing)/data/**",
                "./src/features/!(pricing)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/production/**",
              from: [
                "./src/features/!(production)/components/**",
                "./src/features/!(production)/contexts/**",
                "./src/features/!(production)/data/**",
                "./src/features/!(production)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/purchasing/**",
              from: [
                "./src/features/!(purchasing)/components/**",
                "./src/features/!(purchasing)/contexts/**",
                "./src/features/!(purchasing)/data/**",
                "./src/features/!(purchasing)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/qc/**",
              from: [
                "./src/features/!(qc)/components/**",
                "./src/features/!(qc)/contexts/**",
                "./src/features/!(qc)/data/**",
                "./src/features/!(qc)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/reports/**",
              from: [
                "./src/features/!(reports)/components/**",
                "./src/features/!(reports)/contexts/**",
                "./src/features/!(reports)/data/**",
                "./src/features/!(reports)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/scanning/**",
              from: [
                "./src/features/!(scanning)/components/**",
                "./src/features/!(scanning)/contexts/**",
                "./src/features/!(scanning)/data/**",
                "./src/features/!(scanning)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/settings/**",
              from: [
                "./src/features/!(settings)/components/**",
                "./src/features/!(settings)/contexts/**",
                "./src/features/!(settings)/data/**",
                "./src/features/!(settings)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/suppliers/**",
              from: [
                "./src/features/!(suppliers)/components/**",
                "./src/features/!(suppliers)/contexts/**",
                "./src/features/!(suppliers)/data/**",
                "./src/features/!(suppliers)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/users/**",
              from: [
                "./src/features/!(users)/components/**",
                "./src/features/!(users)/contexts/**",
                "./src/features/!(users)/data/**",
                "./src/features/!(users)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/vendors/**",
              from: [
                "./src/features/!(vendors)/components/**",
                "./src/features/!(vendors)/contexts/**",
                "./src/features/!(vendors)/data/**",
                "./src/features/!(vendors)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
            },
            {
              target: "./src/features/weavers/**",
              from: [
                "./src/features/!(weavers)/components/**",
                "./src/features/!(weavers)/contexts/**",
                "./src/features/!(weavers)/data/**",
                "./src/features/!(weavers)/utils/**",
              ],
              message:
                "Cross-feature import reaches past the feature's public barrel. Import from the feature root instead of its internals — see src/features/<feature>/index.ts.",
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
