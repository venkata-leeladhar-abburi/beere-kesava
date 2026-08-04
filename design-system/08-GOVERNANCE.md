# BK LOOM DESIGN SYSTEM
# Phase 8 — Migration, Governance & Enforcement

**Scope:** The complete measured baseline, the ratchet, ESLint rules, automated design checks, codemods, the component gallery, bundle budgets, migration sequencing, and governance.
**Depends on:** Phases 1–7.
**Blocks:** nothing. This is the phase that makes the other seven permanent.

---

# PART A — THE AUDIT

## A.1 The good news: a working ratchet already exists

Unlike every other layer, the enforcement layer here is **well-built**. `eslint.config.js` opens with this:

```js
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
 * the plan is to flip each to `error` once its count reaches 0.
 * A rule you can't enforce yet is still worth having on as a warning — it's
 * a countdown, not a suggestion.
 */
```

That last sentence is exactly the right philosophy, and Phase 8 does not replace it — **it extends it with design-system rules using the same pattern.**

Also already in place:

| Asset | State |
|---|---|
| CI workflow | 6 jobs: `typecheck`, `typecheck:strict`, `lint`, `format` (informational), `test`, `build + bundle-size` |
| Bundle-size gate | `check-bundle-size.mjs` — INITIAL 250 KB, TOTAL 1050 KB gzipped, documented |
| Vendor chunking | `manualChunks` splitting react / radix / charts / xlsx / icons / motion |
| Import boundaries | `import/no-restricted-paths` zones generated for all 24 features |
| Strict TS ratchet | separate `tsconfig.strict.json` running as its own CI job |
| Honest deferral | 242 `jsx-a11y` violations downgraded to `warn` with a written note that the fix is *"scoped as its own phase in the roadmap, not swept under"* |

**That deferred a11y phase is Phases 3 and 5.** Phase 8 is where it gets closed.

## A.2 🐛 The design system would ship unlinted

```js
ignores: [
  "dist/**",
  "node_modules/**",
  "src/shared/ui/**",   // ← shadcn/radix primitives — generated, not hand-authored
],
```

That exclusion was correct when `shared/ui/` held only generated shadcn files. But **Phases 3–7 put the entire design system inside `shared/ui/`**:

```
shared/ui/primitives/    18 components   (Phase 3)
shared/ui/data/          16 components   (Phase 4)
shared/ui/overlay/       10 components   (Phase 5)
shared/ui/feedback/       4 components   (Phase 5)
shared/ui/date/           6 components   (Phase 5)
shared/ui/nav/            6 components   (Phase 5)
shared/ui/domain/        12 components   (Phase 6)
shared/ui/document/      14 components   (Phase 7)
```

**~86 hand-authored components would be exempt from every lint rule, including the a11y rules they exist to enforce.** A `Button` with a missing `aria-*` would pass CI silently, and every feature would inherit the defect.

## A.3 Test coverage is 9 files

```bash
$ find src -name "*.test.ts*" | wc -l
9
```

Nine test files against 507 components. There is:
- no contrast test (so a colour regression is invisible)
- no token test (so a hardcoded hex passes)
- no visual regression (so a layout regression passes)
- no coverage threshold in CI
- **no test for `formatINR`** — which is why the 10× lakh bug (Phase 6, A.1) has been live

## A.4 Format check is disabled

```yaml
format:
  name: Format check (informational)
  continue-on-error: true    # 211 pre-existing files don't match Prettier
```
Honestly documented, but it means formatting drift is unbounded.

## A.5 The complete measured baseline

```
─── COLOUR & TYPE ─────────────────────────────────────────────
  #8B7060 (4.11:1 taupe)                              88
  gold used as `color:` (2.55:1)                      10
  fontSize below 12px                             1,716
  font families loaded                                 9
  local theme.ts / theme.tsx files                    21
  files using inline style={{}}                      412

─── LAYOUT ────────────────────────────────────────────────────
  100vh occurrences                                   55
  zIndex >= 1000                                       40
  rgba(0,0,0,0.x) scrims                             150
  nav-height constants                                 9

─── PRIMITIVES ────────────────────────────────────────────────
  raw <button>                                       752
  <motion.button>                                    248
  raw <input>                                        270
  raw <select>                                        85
  aria-* attributes (total)                           27
  icon libraries                                       2

─── DATA ──────────────────────────────────────────────────────
  raw <table>                                         65
  grid-as-table (div + fr columns)                   262
  <th> below 12px                                     30
  <th> using mono                                     25
  <th> using failing taupe                            53

─── OVERLAYS ──────────────────────────────────────────────────
  role="dialog"                                        0
  Escape handlers                                      0
  focus traps                                          0
  toast call sites                                    12

─── DOMAIN ────────────────────────────────────────────────────
  fontFamily: F.mono applications                  1,206
  ₹ literals                                         624
  distinct status literals                            52
  formatINR implementations                            2  (one with a 10× bug)

─── DOCUMENTS ─────────────────────────────────────────────────
  window.print() calls                                 6
  @media print rules                                   0
  PDF libraries                                        0
  quotation implementations                            3
```

**1,716 sub-12px font sizes and 1,206 monospace applications** are the two numbers that most directly explain the original complaint: *"the text sizes are not good, the mono font is not good, in some spaces the text is not visible."*

---

# PART B — PRINCIPLES

| # | Principle | Mechanism |
|---|---|---|
| **G1** | **Every count goes to zero, or it isn't done.** | The ratchet table. `warn` → `error` at zero. |
| **G2** | **The design system is code, so it gets linted.** | Remove `shared/ui/**` from `ignores`. |
| **G3** | **Correctness gets a test, not a promise.** | Contrast, tokens and money get CI checks. |
| **G4** | **Mechanical changes get a codemod.** | 1,716 font sizes are not a manual task. |
| **G5** | **Nothing regresses silently.** | A rule lands the same day the count drops. |
| **G6** | **Migrate by feature, not by rule.** | One feature fully migrated beats 24 features half-migrated. |
| **G7** | **The gallery is the source of truth.** | If it isn't in the gallery, it isn't in the system. |

---

# PART C — THE RATCHET

## C.1 Colour & typography

| Metric | Base | Target | Rule | Phase |
|---|---|---|---|---|
| `#8B7060` occurrences | **88** | 0 | `bk/no-deprecated-color` | 1 |
| Gold as `color:` | **10** | 0 | `bk/no-deprecated-color` | 1 |
| `fontSize` < 12 | **1,716** | 0 | `bk/min-font-size` | 1 |
| Raw hex in `features/` | ~600 | 0 | `bk/no-raw-color` | 8 |
| Font families | **9** | 3 | `bk/font-allowlist` | 1 |
| Local `theme.ts` files | **21** | 0 | `bk/no-local-theme` | 1 |
| Files with inline `style={{}}` | **412** | < 50 | `bk/no-style-prop` | 3–7 |

## C.2 Layout

| Metric | Base | Target | Rule | Phase |
|---|---|---|---|---|
| `100vh` | **55** | 0 | `bk/no-vh` | 2 |
| `zIndex` ≥ 1000 | **40** | 0 | `bk/z-index-token` | 5 |
| Distinct z-index values | **41** | 10 | `bk/z-index-token` | 5 |
| Scrim opacities | **150** occurrences, 10 values | 1 | `bk/one-scrim` | 5 |
| Nav-height constants | **9** | 4 | — (types) | 2 |
| `mobile.css` `!important` | **~40** | 0 | file deleted | 2 |
| Non-responsive `"1fr 1fr"` | **138** | < 20 | `bk/prefer-layout-recipe` | 2 |

## C.3 Primitives & accessibility

| Metric | Base | Target | Rule | Phase |
|---|---|---|---|---|
| Raw `<button>` | **752** | 0 | `bk/no-raw-button` | 3 |
| `<motion.button>` | **248** | 0 | `bk/no-motion-button` | 3 |
| Raw `<input>` | **270** | 0 | `bk/no-raw-input` | 3 |
| Raw `<select>` | **85** | 0 | `bk/no-raw-select` | 3 |
| `jsx-a11y` violations | **242** | 0 | flip set to `error` | 3, 5 |
| Icon libraries | **2** | 1 | `bk/no-phosphor` | 3 |
| Distinct icon sizes | **14** | 5 | `bk/icon-size-token` | 3 |

## C.4 Data display

| Metric | Base | Target | Rule | Phase |
|---|---|---|---|---|
| Raw `<table>` | **65** | 0 | `bk/no-raw-table` | 4 |
| Grid-as-table | **262** | < 60 | `bk/no-grid-table` (warn) | 4 |
| `<th>` < 12px | **30** | 0 | `bk/min-font-size` | 4 |
| `<th>` in mono | **25** | 0 | `bk/mono-scope` | 4 |
| Chart marks in gold | **21** | 0 | `bk/no-gold-series` | 4 |
| Chart labels < 12px | **248** | 0 | `bk/min-font-size` | 4 |

## C.5 Overlays & feedback

| Metric | Base | Target | Rule | Phase |
|---|---|---|---|---|
| `role="dialog"` | **0** | all | `bk/use-modal-primitive` | 5 |
| Escape handlers | **0** | all | via primitive | 5 |
| Focus traps | **0** | all | via primitive | 5 |
| Toast call sites | **12** | ≥ 100 | `bk/mutation-needs-feedback` (warn) | 5 |
| Native `type="date"` | **14** | 0 | `bk/no-native-date` | 5 |

## C.6 Domain

| Metric | Base | Target | Rule | Phase |
|---|---|---|---|---|
| `fontFamily: F.mono` | **1,206** | < 150 | `bk/mono-scope` | 6 |
| `₹` literals | **624** | 0 | `bk/no-currency-literal` | 6 |
| Distinct status literals | **52** | 0 (typed) | types | 6 |
| `formatINR` implementations | **2** | 1 | `bk/one-money-formatter` | 6 |
| `parseFloat` on money | ~20 | 0 | `bk/no-float-money` | 6, 7 |

## C.7 Documents

| Metric | Base | Target | Rule | Phase |
|---|---|---|---|---|
| Raw `window.print()` | **6** | 0 | `bk/no-raw-print` | 7 |
| `@media print` rules | **0** | ≥ 1 | CI check | 7 |
| PDF libraries | **0** | 1 | — | 7 |
| Quotation implementations | **3** | 1 | — | 7 |

## C.8 The tracker

```bash
npm run ratchet
```

```
BK LOOM RATCHET                                    2026-08-04

COLOUR & TYPE
  #8B7060                    88 →     0   ████████░░  ratcheted ✓ error
  fontSize < 12           1,716 →   140   ███████░░░  92%  warn
  local theme.ts             21 →     3   ████████░░  86%  warn
PRIMITIVES
  raw <button>              752 →   410   █████░░░░░  45%  warn
  motion.button              248 →     0   ██████████  ratcheted ✓ error
  aria-* attributes           27 →   1,204        ↑    (inverse metric)
…
34 metrics · 9 ratcheted to error · 21 in progress · 4 not started
```

Written to `docs/RATCHET.md` on every CI run and posted as a PR comment showing the delta. A PR that *increases* any count fails.

---

# PART D — THE ESLINT RULE SET

## D.1 Fix the blind spot first

```diff
  ignores: [
    "dist/**",
    "node_modules/**",
-   "src/shared/ui/**",
+   "src/shared/ui/_legacy/**",   // the 49 retired shadcn files only
  ],
```

Then add a stricter override for the design system itself — it is held to a *higher* standard than feature code, because every defect it ships multiplies:

```js
{
  files: ["src/shared/ui/{primitives,data,overlay,feedback,date,nav,domain,document}/**"],
  rules: {
    ...Object.fromEntries(
      Object.entries(jsxA11y.configs.recommended.rules).map(([r]) => [r, "error"])
    ),
    "@typescript-eslint/no-explicit-any": "error",
    "react/prop-types": "off",
    "bk/no-raw-color": "error",
    "bk/no-style-prop": "error",
  },
}
```

## D.2 The `eslint-plugin-bk` rules

A local plugin at `frontend/eslint-plugin-bk/`. Each rule cites the phase and the count it retires.

### Colour & type
```js
'bk/no-deprecated-color'   // #8B7060, #C4923A, #E8A84A, #E7C983, #A0506A, rgba(0,0,0,0.1)
                           // autofixable → the Phase 1 DEPRECATED map
'bk/no-raw-color'          // any hex/rgb/hsl in features/ → use a token
'bk/min-font-size'         // fontSize < 12, incl. decimals like 11.5 — no autofix, needs judgement
'bk/font-allowlist'        // only Fraunces | Inter | IBM Plex Mono
'bk/mono-scope'            // mono only inside EntityCode / doc-code
'bk/no-local-theme'        // no `const T = {…}` colour objects in features/
```

### Layout
```js
'bk/no-vh'                 // 100vh → 100dvh or --shell-content-min-h   (autofixable)
'bk/z-index-token'         // numeric zIndex → --z-* ladder
'bk/one-scrim'             // rgba(0,0,0,x) as a background → --surface-scrim
'bk/spacing-grid'          // padding/margin/gap off the 4pt grid (warn)
'bk/prefer-layout-recipe'  // gridTemplateColumns "1fr 1fr" → .bk-layout-*
```

### Primitives
```js
'bk/no-raw-button'         // <button> → <Button> / <IconButton>
'bk/no-motion-button'      // <motion.button> → <Button>  (buttons don't scale)
'bk/no-raw-input'          // <input> → <Input> in a <Field>
'bk/no-raw-select'         // <select> → <Select> / <Combobox>
'bk/no-phosphor'           // @phosphor-icons → lucide-react
'bk/icon-size-token'       // icon size ∈ {12,14,16,20,24}
'bk/no-style-prop'         // no `style` on design-system components
```

### Data
```js
'bk/no-raw-table'          // <table> → <DataTable>
'bk/no-grid-table'         // ≥4 fr-columns with a header row (warn — needs judgement)
'bk/no-gold-series'        // fill/stroke referencing gold → --chart-N
'bk/chart-label-size'      // recharts tick fontSize ≥ 12
```

### Overlays
```js
'bk/use-modal-primitive'   // position:fixed + a scrim → <Modal>
'bk/no-native-date'        // type="date"|"month" → <DatePicker>
'bk/mutation-needs-feedback' // an async handler with no toast/optimistic update (warn)
```

### Domain & documents
```js
'bk/no-currency-literal'   // '₹' in JSX → <Money>
'bk/no-float-money'        // parseFloat / * / + on a money-named identifier
'bk/one-money-formatter'   // only lib/domain/money.ts may define one
'bk/explicit-locale'       // bare toLocaleString() → explicit 'en-IN'
'bk/no-raw-print'          // window.print() → useDocument().print()
```

## D.3 The ratchet mechanic

```js
// eslint-plugin-bk/ratchet.js — counts live in ratchet.json, updated by CI
const RATCHET = require('./ratchet.json');
const level = (rule) => RATCHET[rule]?.current === 0 ? 'error' : 'warn';
```
When a count hits zero, the rule becomes an `error` **automatically** on the next CI run. No one has to remember to flip it, and it can never regress.

---

# PART E — AUTOMATED DESIGN CHECKS

## E.1 Contrast CI — `npm run check:contrast`

Parses `tokens.css`, computes WCAG ratios for every semantic pair, and fails on a regression:

```
BK LOOM CONTRAST GATE

TEXT ON --surface-canvas                    required   actual   result
  --text-primary       #1D1814                  4.5     17.60   ✓ AAA
  --text-secondary     #4F4A45                  4.5      8.76   ✓ AAA
  --text-tertiary      #69635E                  4.5      5.92   ✓ AA
  --text-accent        #845E04                  4.5      5.86   ✓ AA
  --text-success       #1F774E                  4.5      5.52   ✓ AA
  --text-danger        #AB3832                  4.5      6.28   ✓ AA

NON-TEXT (WCAG 1.4.11)
  --border-default     #D8D2CE                  3.0      1.50   ⚠ decorative-only
  --border-focus       #A63A55                  3.0      6.25   ✓

CHART SERIES — adjacent separation             ≥1.5
  chart-1 / chart-2                                      2.33   ✓
  chart-4 / chart-5                                      1.60   ✓

PASS  ·  0 regressions
```
Runs in CI. **A colour change that breaks contrast cannot merge** — which is the only durable fix for a `#8B7060` coming back.

## E.2 Token drift — `npm run check:tokens`

`tokens.css` and `tokens.ts` are two hand-maintained copies of the same values. This test parses both and asserts equality:

```
✓ 96 tokens match between tokens.css and tokens.ts
✗ --text-tertiary: css #69635E, ts #6B655F   ← would fail CI
```

## E.3 Money property test

```ts
test('compact money is monotonic', () => {
  fc.assert(fc.property(fc.integer({ min: 0, max: 1e11 }), (a) => {
    const parse = (s) => { /* '₹12.4L' → 1240000 */ };
    expect(parse(formatMoney(a, {compact:true})))
      .toBeLessThanOrEqual(parse(formatMoney(a + 100_00, {compact:true})));
  }));
});
```
Plus the explicit boundary table from Phase 6, Step 1.

## E.4 Visual regression

`@playwright/test` screenshots of the gallery: every component × every variant × light/dark × 375/768/1440. ~600 snapshots, diffed per PR, review UI on failure.

Full-page snapshots of 10 key screens (dashboard, inventory table, invoice document, customer detail, login) catch layout regressions that unit tests can't.

## E.5 Accessibility CI

`axe-core` via `@axe-core/playwright` on the gallery and the 10 key screens. Zero violations required for the design system; the ratchet applies to feature screens.

Plus keyboard-path tests for the flows that had zero coverage: open modal → complete form → submit → dismiss toast, entirely by keyboard.

---

# PART F — CODEMODS

```
scripts/codemods/
  01-deprecated-colors.ts     88 + 10 sites   ✅ fully automatic
  02-font-sizes.ts         1,716 sites        ⚠ automatic + review
  03-radius.ts                27 values       ✅ automatic
  04-spacing-grid.ts         474 values       ⚠ automatic + review
  05-z-index.ts               41 values       ✅ automatic
  06-scrim.ts                150 sites        ✅ automatic
  07-motion-button.ts        248 sites        ⚠ semi (variant inference)
  08-icon-button.ts          ~400 sites       ⚠ semi (needs a `label`)
  09-phosphor-to-lucide.ts    36 files        ✅ automatic
  10-mono-scope.ts         1,206 sites        ⚠ semi (code vs number vs label)
  11-currency.ts             624 sites        ⚠ semi
  12-status-normalize.ts      52 values       ✅ automatic (case/word-order)
  13-theme-reexport.ts        21 files        ✅ automatic
  14-window-print.ts           6 sites        ✅ automatic
```

**Rules for every codemod:**
1. Idempotent — running twice changes nothing the second time.
2. One codemod per commit, with the before/after count in the message.
3. `--dry-run` prints a diff summary and touches nothing.
4. `--feature=inventory` scopes it, so review stays small.
5. Emits `// TODO(bk-migration):` where it cannot decide, rather than guessing.

### The two that need judgement

**`02-font-sizes`** maps to the nearest token but **never rounds down below 12**:
```
8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5  →  12   (flagged for review — a size change is visible)
12, 12.5                            →  12
13, 13.5                            →  13
14, 14.5, 15                        →  14
```
The sub-12 group is 1,716 sites and every one is a deliberate visual change. The codemod applies it and tags each with a TODO so a human confirms the layout still works.

**`10-mono-scope`** classifies each usage by inspecting the adjacent value:
```
matches /^[A-Z]{2,6}-[\dA-Z-]+$/   → <EntityCode>       (stays mono)
inside a <th>                       → overline           (Inter)
adjacent to ₹ or a currency name    → <Money>            (Inter + tabular)
matches a date format               → date formatter     (Inter + tabular)
purely numeric                      → tabular            (Inter)
otherwise                           → TODO(bk-migration) (human decides)
```

---

# PART G — THE COMPONENT GALLERY

```
/_design                          (superadmin-gated, excluded from the production build)
├── Foundations   colour · type · spacing · radius · elevation · motion · icons
├── Primitives    18 components × every variant × every state
├── Data          tables · grids · metrics · charts
├── Overlays      modals · drawers · menus · toasts · dates
├── Domain        codes · statuses · money · entity cards
├── Documents     all 6, rendered at A4 with a print preview
└── Patterns      page templates · form layouts · empty states
```

Every entry shows: the component, its props table, a copy-paste snippet, **its live contrast ratios**, and its keyboard map.

The **Foundations → Colour** page renders every token with its computed ratio against its intended background, recomputed in the browser — so a bad colour is visible immediately, not just in CI.

**Rule:** a component that isn't in the gallery isn't in the system. Adding one to `shared/ui/` without a gallery entry fails CI (`check:gallery-coverage`).

---

# PART H — BUNDLE BUDGETS

| Change | Δ gzipped |
|---|---|
| 9 font families → 3 | **−180 KB** |
| Remove `@phosphor-icons/react` (Phase 3) | **−40 KB** |
| Retire 49 unused shadcn components (Phase 3) | **−25 KB** |
| Delete 21 local theme files (Phase 1) | −6 KB |
| Delete `mobile.css` (Phase 2) | −2 KB |
| Delete 382 `AnimatePresence` blocks (Phase 5) | −8 KB |
| **Add** design system (~86 components) | **+55 KB** |
| **Add** PDF client hooks (server-side render) | +2 KB |
| **Net** | **≈ −204 KB** |

```diff
- const INITIAL_BUDGET_KB = 250;
- const TOTAL_BUDGET_KB   = 1050;
+ const INITIAL_BUDGET_KB = 200;   // Phase 8 target after the font + icon consolidation
+ const TOTAL_BUDGET_KB   = 850;   // was ~996 measured; −204 KB from the DS migration
```

```diff
- if (id.includes('lucide-react') || id.includes('@phosphor-icons')) return 'vendor-icons'
+ if (id.includes('lucide-react')) return 'vendor-icons'
```

**Fonts get self-hosted** via `@fontsource-variable/*` — removing two render-blocking Google Fonts requests, eliminating a third-party dependency on first paint, and letting the 3 families be preloaded with `font-display: swap`.

---

# PART I — MIGRATION SEQUENCING

## I.1 Migrate by feature, not by rule

Running codemod 01 across all 24 features produces an 88-file diff nobody can review. Migrating `inventory` fully produces a reviewable diff that proves the whole system end to end.

**Per-feature checklist:**
```
□ theme.ts re-exports from @/design-system/tokens
□ 0 deprecated colours
□ 0 fontSize < 12
□ 0 raw <button> / <motion.button>
□ every <input> inside a <Field>
□ tables use <DataTable>
□ modals use <Modal>
□ money uses <Money>, codes use <EntityCode>
□ status is a typed union
□ axe: 0 violations
□ keyboard-only pass
□ visual snapshot approved
```

## I.2 Feature order

| Wave | Features | Why |
|---|---|---|
| **1 — Pilot** | `inventory` | Highest density: the 9px-mono-taupe header, 12-col table, modals, money, codes. If the system works here it works anywhere. |
| **2 — High traffic** | `dashboards`, `payments`, `weavers` | Most-used screens; earliest visible payoff |
| **3 — Documents** | `purchasing`, `finishing`, `bulk-orders` | Depends on Phase 7 |
| **4 — Partners** | `customers`, `suppliers`, `vendors`, `firms` | Similar shapes — fast once the cards exist |
| **5 — Operations** | `production`, `materials`, `qc`, `pricing` | |
| **6 — Portals** | `portals` (weaver, shop, worker) | Largest local themes (408 + 229 lines) |
| **7 — Remainder** | `reports`, `users`, `settings`, `audit`, `notifications`, `design-library`, `scanning` | |

## I.3 The shim that makes it incremental

Because Phase 1 Step 7 has each feature's `theme.ts` re-export from the system with **unchanged keys**, a feature can adopt the token values before adopting the components. Colour and type fix themselves first — the visible win — while component migration proceeds at its own pace.

---

# PART J — GOVERNANCE

## J.1 Versioning

The design system is versioned in `shared/ui/version.ts` and follows semver:

| Change | Bump |
|---|---|
| New component, new variant, new token | **minor** |
| Bug fix, contrast correction, a11y fix | **patch** |
| Removed prop, renamed token, changed default | **major** |

Breaking changes ship with a codemod. `CHANGELOG.md` records every token value change with its before/after contrast ratio.

## J.2 Adding to the system

A new component requires all seven:
1. It's needed in **≥3 places** (twice is a local component)
2. Full variant × state matrix defined before implementation
3. Keyboard map documented
4. `axe` clean
5. Gallery entry with props table and snippet
6. Visual regression snapshots
7. A ratchet row if it replaces an existing pattern

## J.3 The review checklist

Added to `.github/pull_request_template.md`:

```markdown
### Design system
- [ ] No raw hex — semantic tokens only
- [ ] No fontSize below 12
- [ ] Spacing on the 4pt grid
- [ ] Buttons/inputs/tables/modals use the system primitives
- [ ] Interactive targets have a ≥44px hit area
- [ ] Keyboard-navigable; focus visible
- [ ] Meaning is never carried by colour alone
- [ ] Money via <Money>; codes via <EntityCode>
- [ ] Ratchet counts did not increase
```

## J.4 Ownership

| Area | Owner |
|---|---|
| Tokens (Phase 1) | Design system owner — changes require the contrast gate |
| Primitives (3), Data (4), Overlays (5) | Design system owner |
| Domain (6), Documents (7) | Domain owner + design review |
| Feature usage | Feature owner |

Token changes require two approvals. Anyone can propose; the contrast gate is not overridable.

---

# PART K — ROLLOUT

| Weeks | Work | Ratchet effect |
|---|---|---|
| **1** | Land tokens, fonts, print isolation, money fix, `SUB_NAV_H` fix, contrast CI, `shared/ui` un-ignored | 3 correctness bugs closed |
| **2** | Codemods 01, 03, 05, 06, 13, 14 across all features | `#8B7060` 88→0 · radius 27→8 · z≥1000 40→0 · scrim 150→1 · themes 21→0 · print 6→0 |
| **3–4** | Build Phase 3 primitives; migrate `inventory` end to end | Pilot proven |
| **5–6** | Codemod 02 (font sizes) + 09 (phosphor) + 10 (mono), reviewed per feature | fontSize<12 **1,716→0** · mono **1,206→<150** · icon libs 2→1 |
| **7–9** | Phase 4 data layer; migrate waves 2–3 | `<table>` 65→0 · grid-tables 262→<60 |
| **10–12** | Phase 5 overlays; migrate all modals | dialogs 0→63 · Escape 0→all · toasts 12→100+ |
| **13–14** | Phase 6 domain; codemods 11, 12 | `₹` 624→0 · statuses 52→typed |
| **15–16** | Phase 7 documents + PDF service | 6 documents, 1 quotation impl |
| **17–18** | Waves 4–7; flip every zeroed rule to `error` | ~30 rules at `error` |
| **19–20** | Visual regression baseline, gallery, docs, budget reduction | 250→200 KB initial |

Weeks 1–2 alone close three real bugs and retire six ratchet rows — the highest ratio of value to risk in the whole programme.

---

# PART L — DEFINITION OF DONE

### Enforcement
- [ ] `src/shared/ui/**` removed from ESLint `ignores`; only `_legacy/**` excluded
- [ ] `eslint-plugin-bk` shipped with all ~30 rules
- [ ] Design-system directories held to `error`-level a11y rules
- [ ] `ratchet.json` auto-flips a rule to `error` at zero
- [ ] `npm run ratchet` runs in CI and comments on PRs
- [ ] A PR that increases any count fails

### Automated checks
- [ ] `check:contrast` in CI — no colour change can break WCAG
- [ ] `check:tokens` — `tokens.css` and `tokens.ts` cannot drift
- [ ] Money property test proves compact output is monotonic
- [ ] Visual regression baseline established (~600 snapshots)
- [ ] `axe` clean on the gallery and 10 key screens
- [ ] Coverage threshold enforced; test files 9 → 150+
- [ ] Prettier `continue-on-error` removed after the reformat PR

### Counts at zero
- [ ] `#8B7060` **88 → 0**
- [ ] `fontSize < 12` **1,716 → 0**
- [ ] `fontFamily: F.mono` **1,206 → < 150**
- [ ] `₹` literals **624 → 0**
- [ ] raw `<button>` **752 → 0** · `motion.button` **248 → 0**
- [ ] raw `<input>` **270 → 0** · `<select>` **85 → 0**
- [ ] raw `<table>` **65 → 0** · grid-tables **262 → < 60**
- [ ] `100vh` **55 → 0** · `zIndex ≥ 1000` **40 → 0** · scrims **150 → 1**
- [ ] local `theme.ts` **21 → 0** · font families **9 → 3**
- [ ] `role="dialog"` **0 → 63** · Escape handlers **0 → all**
- [ ] `window.print()` **6 → 0** · `@media print` **0 → shipped**
- [ ] `jsx-a11y` violations **242 → 0**, whole set flipped to `error`

### Governance
- [ ] Gallery at `/_design`; every component present; coverage check in CI
- [ ] `CHANGELOG.md` records every token change with its contrast delta
- [ ] PR template includes the design checklist
- [ ] Bundle budgets lowered to 200 KB / 850 KB and met
- [ ] Fonts self-hosted; zero third-party font requests
- [ ] `CONTRIBUTING.md` documents the seven-point component bar

---

# THE PROGRAMME, END TO END

| Phase | Delivers | Headline number retired |
|---|---|---|
| **1 — Foundations** | Colour, type, spacing, radius, elevation, motion tokens | `#8B7060` at 4.11:1 → `#69635E` at 5.92:1 |
| **2 — Layout** | App shell, page template, grid, density, responsive | 9 nav constants → 4; `mobile.css` deleted |
| **3 — Primitives** | 18 components, full state matrix | 1,000 hand-built buttons → 1 `Button` |
| **4 — Data** | Table, grid, metrics, charts | 9px mono headers at 4.11:1 → 12px Inter at 5.92:1 |
| **5 — Overlays** | Modals, menus, dates, toasts, nav | 63 modals, **0** with `role="dialog"` → all |
| **6 — Domain** | Codes, statuses, money | ₹10,00,000 displayed as ₹1.00L → correct |
| **7 — Documents** | Invoice, quotation, PO, challan, receipt, statement | Printing an invoice printed the whole app → prints the document |
| **8 — Governance** | Ratchet, rules, codemods, gallery, CI | Every count above, locked at zero |

### Three correctness bugs found along the way

1. **`SUB_NAV_H` = 60 in `TopNav.tsx`, 66 in `section-navigator-data.ts`** — every anchored scroll on the admin dashboard lands 6px off, while superadmin is correct. *(Phase 2)*
2. **`formatINR` compact divides by 1,000,000 and labels it "L"** — ₹10,00,000 renders as ₹1.00L, a 10× understatement, and the display *decreases* as the value crosses ten lakh. No crore tier exists. *(Phase 6)*
3. **6 `window.print()` calls, 0 `@media print` rules** — printing an invoice emits the nav, the scrim, the modal chrome and the page behind it. *(Phase 7)*

Each is independently shippable and worth fixing before any visual work begins.
