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

  /**
   * PHASE 3–7 RATCHET LAYER — consolidated (design-system/0{3,4,5,6,7}-*.md)
   * ═══════════════════════════════════════════════════════════════════════════
   * These used to be 4 separate config objects (one appended per phase),
   * each independently setting `rules: { "no-restricted-syntax": [...] }`
   * against the *same* "src/features, any depth, .tsx" glob. ESLint flat config
   * does not merge same-named-rule settings across matching config objects
   * — the last one wins outright. Confirmed via
   * `eslint --print-config <file> | jq .rules["no-restricted-syntax"]`:
   * only the most-recently-appended block's selectors were actually being
   * checked; every earlier phase's raw-<table>, gold-chart-fill, z-index,
   * native-date, and (this pass's) ₹/mono/toLocaleString rules were being
   * silently skipped app-wide the moment the next phase's block was added.
   * Merged into one block so every selector is actually live. window.print()
   * stays a separate block below since it's the one `error`-severity rule —
   * a single `no-restricted-syntax` call can't mix severities per selector.
   *
   * `warn`, not `error`, for all of these — none of the backlogs are
   * cleared (raw <table> 2 remaining, 416 `₹` literals, 1,084
   * `fontFamily: F.mono`, 150+ `rgba(0,0,0,x)` zIndex-adjacent literals,
   * 62 parseFloat calls never individually audited). This is a ratchet:
   * stop new instances while the real migrations (mostly Phase 8's job)
   * are still in progress, without failing the build on pre-existing code.
   *
   * The `₹` selector uses a regex, not an exact-match literal like
   * design-system/06-DOMAIN.md Part I Step 7's own pseudocode
   * (`Literal[value="₹"]`) — an exact match only catches a bare `"₹"`
   * string standing completely alone and misses every `` `₹${amount}` ``
   * template literal, which is how most real call sites write it. A second
   * selector catches the template-literal form specifically.
   */
  {
    files: ["src/features/**/*.tsx"],
    ignores: ["**/*.test.tsx", "**/*.spec.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXOpeningElement[name.name='table']",
          message: "Use <DataTable> from shared/ui/data instead of a raw <table> — design-system/04-DATA-DISPLAY.md.",
        },
        {
          selector: "JSXOpeningElement[name.name='th']",
          message: "Columns are declared via ColumnDef, not <th> — design-system/04-DATA-DISPLAY.md Part C.",
        },
        {
          selector: "JSXAttribute[name.name='fill'] MemberExpression[property.name=/^(antiqueGold|goldLight)$/]",
          message: "Gold is decorative, never a chart data colour. Use semantic.chart.series[i] from design-system/tokens — design-system/04-DATA-DISPLAY.md Part K.1.",
        },
        {
          selector: "Property[key.name='zIndex'] Literal[value=/^[0-9]{4,}$/]",
          message: "Use the --z-* ladder from styles/tokens.css, not a raw literal — design-system/05-OVERLAYS.md Part C.1.",
        },
        {
          selector: "JSXAttribute[name.name='type'] Literal[value='date']",
          message: "Use <DatePicker> from shared/ui/date, not a native type=\"date\" input — design-system/05-OVERLAYS.md Part K.4.",
        },
        {
          selector: "Literal[value=/₹/]",
          message: "Use <Money> from shared/ui/domain instead of a hand-placed ₹ literal — design-system/06-DOMAIN.md Part E.4.",
        },
        {
          selector: "TemplateElement[value.raw=/₹/]",
          message: "Use <Money> from shared/ui/domain instead of a ₹ template literal — design-system/06-DOMAIN.md Part E.4.",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleString'][arguments.length=0]",
          message: "Bare toLocaleString() is locale-dependent (renders 1,00,000 as 100,000 in en-US). Use formatMoney/formatQuantity or an explicit en-IN formatter — design-system/06-DOMAIN.md Part F.3.",
        },
        {
          selector: "Property[key.name='fontFamily'] MemberExpression[property.name='mono']",
          message: "Mono is for entity codes only. Use <EntityCode> from shared/ui/domain, or Inter + tabular figures — design-system/06-DOMAIN.md Part C.4/M7.",
        },
        {
          selector: "CallExpression[callee.name='parseFloat']",
          message: "If this is money, use lib/gst's integer-paise helpers instead — parseFloat on currency reintroduces float-drift totals that don't reconcile. design-system/07-DOCUMENTS.md Part A.4/I.5.",
        },
      ],
    },
  },

  /**
   * PHASE-7 window.print() — deliberately `error`, not `warn`
   * (design-system/07-DOCUMENTS.md, Part N Step 9). This one has no backlog
   * to grandfather: all 6 flagged call sites (Part A.1) were migrated to
   * useDocument() in the same pass that added this rule, confirmed via
   * `rg "window\.print\(\)"` returning zero app-code hits. A new raw call
   * silently reintroduces "printing prints the whole app." Scoped wider
   * than the ratchet block above (`shared` too, minus `shared/ui/document`
   * itself, which legitimately owns the one real `window.print()` call
   * inside `useDocument()`).
   *
   * Uses `no-restricted-properties`, a DIFFERENT rule name from
   * `no-restricted-syntax` above, on purpose — not just "the right tool for
   * a single object.property check." Two config objects that both match
   * `src/features/**` and both set the *same* rule name collide (see the
   * consolidation comment above); giving this its own rule name is what
   * lets it coexist at a different severity without re-triggering that bug,
   * regardless of which block happens to be listed last.
   */
  {
    files: ["src/features/**/*.tsx", "src/shared/**/*.tsx"],
    ignores: ["**/*.test.tsx", "**/*.spec.tsx", "src/shared/ui/document/**"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "print",
          message: "Use useDocument().print() from shared/ui/document, not a raw window.print() — it prints the whole app (nav, scrim, modal chrome). design-system/07-DOCUMENTS.md Part C.3.",
        },
      ],
    },
  },

  prettierConfig
);
