# BK LOOM DESIGN SYSTEM
# Phase 4 — Data Display

**Scope:** Table, DataGrid, column types, sorting, selection, row states, empty/loading/error states, Pagination, MetricCard, StatTile, Progress, Sparkline, and the full Chart system.
**Depends on:** Phase 1 (colour, type, chart palette), Phase 2 (density, sticky, responsive), Phase 3 (Button, Badge, StatusPill, Checkbox, Skeleton).
**Blocks:** Phases 6–7.

---

# PART A — THE AUDIT

## A.1 The table-header bug, located exactly

```jsx
/* features/inventory — a real <th> in this codebase */
<th style={{
  fontFamily: F.mono,      // ← JetBrains Mono
  fontSize: 9,             // ← NINE PIXELS
  color: T.taupe,          // ← #8B7060 = 4.11:1  FAILS WCAG AA
}}>
```

And a second one in the same feature:
```jsx
<th style={{
  fontFamily: F.mono,
  fontSize: 10,
  fontWeight: 700,
  color: T.taupe,
}}>
```

**9px monospace at 4.11:1 contrast.** Four separate failures compounding in one element:

| Failure | Measured | Required |
|---|---|---|
| Font size | **9px** | 12px floor |
| Contrast | **4.11:1** | 4.5:1 (WCAG 1.4.3) |
| Typeface | Monospace | Mono is for entity codes only (Phase 1) |
| Weight + size | 700 @ 9–10px | Bold below 12px thickens strokes into mush |

### How widespread it is

```
<th> font sizes across features/:
   9  ×4      9.5 ×3     10  ×12    10.5 ×9
  11  ×4     11.5 ×1     12  ×14    13   ×1
13.5 ×1      14  ×2

<th> using F.mono (JetBrains Mono):  25
<th> using T.taupe (#8B7060):        53
```

**Ten distinct header font sizes. 30 of 51 headers render below 12px. 53 headers use the failing taupe. 25 use a monospace font.**

This single element type accounts for most of the legibility complaints in the app.

## A.2 Two parallel table systems, neither using the primitive

| Implementation | Count |
|---|---|
| Real `<table>` elements | **65** across **56 files** |
| `<th>` elements | **300** |
| **Grid-as-table** (`div` + `gridTemplateColumns: "…fr…"`) | **262** |
| Files importing `shared/ui/table` | **0** |

**262 "tables" built from `div`s with CSS grid.** These have:
- no `<th>` → screen readers cannot associate a cell with its column
- no `<caption>` → the table has no accessible name
- no `scope` attributes → row/column relationships are lost
- no keyboard cell navigation

That's a WCAG 1.3.1 failure on more than half the data surfaces in the product. Examples from the grep: `"2fr 130px 130px 150px 80px 36px"`, `"1fr 120px 110px 160px 30px"` — these are unmistakably tables.

Meanwhile `shared/ui/table.tsx` — which is correct — has **zero** importers.

## A.3 Sorting, empty states and pagination are largely absent

| Capability | Coverage |
|---|---|
| Sorting (`sortBy`) | **18** occurrences for **327** tables/grids |
| Empty states ("No … found") | **14** for 327 tables |
| `DataPagination` (the good shared one) | **6** features |
| Inline pagination reimplementations | `pageSize` ×10, `currentPage` ×4 |

So: ~95% of tables cannot be sorted, ~95% have no empty state, and the shared pagination component that already exists is used by 6 of 56 table files.

`DataPagination.tsx` is well-built — `usePagination` is a clean hook — but it carries its own hardcoded theme block:
```js
const T = { royalBurgundy:"#6E0F2D", taupe:"#8B7060", … };
const F = { ui:"'Inter'", mono:"'JetBrains Mono'" };
```
The same failing taupe, the same mono. It's a 22nd theme file.

## A.4 Charts: gold is being used as a data colour

25 files, 53 `<ResponsiveContainer>`. Colour assignment:

```
fill={T.royalBurgundy}   ×14
fill={T.antiqueGold}     ×11     ← 2.55:1
fill={T.goldLight}       ×10     ← 1.61:1
stroke={T.antiqueGold}   ×9
fill={T.green}           ×4
```

**21 chart marks are filled with gold at 2.55:1 or gold-light at 1.61:1.** Per Phase 1, gold is a decorative surface colour that never carries information. A 1.61:1 bar is invisible against a white card.

### The pie-chart ternary chain

Found verbatim in three places:
```jsx
fill={i === 0 ? T.royalBurgundy
    : i === 1 ? "#8A2440"
    : i === 2 ? T.antiqueGold
    : i === 3 ? "#D9B978"
    : "#E3D2AC"}
```

That's `#6E0F2D → #8A2440 → #C89B47 → #D9B978 → #E3D2AC` — a **sequential** burgundy-to-cream ramp being used for **categorical** data. Measured adjacent separation:

```
#6E0F2D / #8A2440   1.36 : 1     ← two dark burgundies, indistinguishable
#8A2440 / #C89B47   3.42 : 1
#C89B47 / #D9B978   1.36 : 1     ← two golds, indistinguishable
#D9B978 / #E3D2AC   1.26 : 1     ← two creams, indistinguishable

vs the Phase 1 palette:
#9A2D4A / #BA8824   2.33 : 1
#BA8824 / #035181   2.66 : 1
#035181 / #C6739C   2.54 : 1
#C6739C / #047879   1.60 : 1
```

**Three of the four adjacent pairs in your pie charts are below 1.4:1.** A five-slice pie where slices 1–2, 3–4 and 4–5 read as the same colour conveys nothing.

## A.5 Chart axis type is below the floor

Font sizes in the reports and payments chart files:
```
8.5 ×2    9 ×27    9.5 ×14    10 ×70    10.5 ×24    11 ×89    11.5 ×22
```
**248 instances below 12px** in chart-heavy files. Axis labels at 8.5–11px in `--text-tertiary` are the second-worst legibility surface after table headers.

`shared/ui/chart.tsx` (the shadcn `ChartContainer` with tooltip/legend primitives) exists and is **unused** — every chart hand-rolls its own `<Tooltip>` styling.

## A.6 Summary

| | Have | Need |
|---|---|---|
| Table implementations | 65 `<table>` + 262 grid-tables, 0 shared | 1 `DataTable` |
| Header font sizes | 10 distinct, 30/51 below 12px | 1 token (`overline`, 12px) |
| Headers using mono | 25 | 0 |
| Headers at 4.11:1 | 53 | 0 |
| Sortable tables | 18 / 327 | all |
| Empty states | 14 / 327 | all |
| Shared pagination adoption | 6 / 56 | all |
| Chart series using gold | 21 | 0 |
| Categorical palettes that separate | 0 | 1 |
| Chart axis labels ≥12px | ~0 | all |

---

# PART B — PRINCIPLES

| # | Principle | Mechanism |
|---|---|---|
| **D1** | **Tables are tables.** | Real `<table>/<thead>/<th scope>`. The 262 grid-tables convert or justify themselves. |
| **D2** | **Columns are data, not markup.** | One `ColumnDef[]` drives desktop table, mobile cards, CSV export and print. |
| **D3** | **Every table has all five states.** | loading · empty · error · filtered-empty · populated. Not optional. |
| **D4** | **Numbers align, text doesn't.** | Numeric right + tabular figures. Text left. Never centred except icons/status. |
| **D5** | **Colour never carries meaning alone.** | Status = dot + text. Chart series = colour + pattern/label. (WCAG 1.4.1) |
| **D6** | **Charts answer one question.** | A chart with no headline question becomes a table. |
| **D7** | **Ink serves data.** | No gradients on bars, no 3D, no drop shadows on marks, no chartjunk. |
| **D8** | **Nothing below 12px.** | Including axis ticks, legends and table headers. |

---

# PART C — THE COLUMN MODEL

The keystone of Phase 4. One definition drives every rendering surface, so the mobile card list, the CSV export and the printed invoice can never drift from the table.

```ts
interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: (row: T) => unknown;

  type?: 'text'|'number'|'currency'|'percent'|'date'|'datetime'
       | 'code'|'status'|'badge'|'avatar'|'actions'|'boolean';

  width?: number | 'auto' | 'min';
  minWidth?: number;
  align?: 'start'|'end'|'center';        // defaults from `type`

  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  filterable?: boolean;
  filterType?: 'text'|'select'|'range'|'date-range'|'multi';

  sticky?: 'start'|'end';
  hideBelow?: 'sm'|'md'|'lg'|'xl';       // responsive column dropping
  priority?: 1|2|3;                       // 1 = shown on the mobile card

  cell?: (value: unknown, row: T) => React.ReactNode;
  footer?: 'sum'|'avg'|'count'|((rows: T[]) => React.ReactNode);

  exportable?: boolean;                   // default true
  printable?: boolean;                    // default true
  headerTooltip?: string;
}
```

### What `type` sets automatically

| `type` | Align | Font | Format |
|---|---|---|---|
| `text` | start | `body-md` | — |
| `number` | **end** | `body-md` + tabular | grouped |
| `currency` | **end** | `body-md` + tabular | `₹` + Indian grouping |
| `percent` | **end** | `body-md` + tabular | 1 decimal + `%` |
| `date` | start | `body-md` + tabular | `12 Jun 2026` |
| `datetime` | start | `body-sm` + tabular | `12 Jun, 2:30 PM` |
| `code` | start | **`code-md`** (Plex Mono 13) | uppercase, no wrap |
| `status` | start | — | `<StatusPill>` |
| `badge` | start | — | `<Badge>` |
| `avatar` | start | — | `<Avatar>` + name |
| `boolean` | center | — | `Check` / `Minus` icon + sr-only text |
| `actions` | **end** | — | `<IconButton>` row, sticky end |

**This is where the mono font finally lands in the right place.** Mono renders in `type: 'code'` cells — weaver codes, batch IDs, invoice numbers — and *nowhere else*. Not in headers, not in currency, not in dates.

---

# PART D — TABLE ANATOMY & SPEC

## D.1 Structure

```
┌───────────────────────────────────────────────────────────┐
│ TOOLBAR   search · filters · density · columns · export   │  optional, sticky
├───────────────────────────────────────────────────────────┤
│ ☐ │ SAREE CODE │ TYPE │ WEAVER │  WEIGHT │  PRICE │  ⋯    │  ← header, sticky
├───┼────────────┼──────┼────────┼─────────┼────────┼───────┤
│ ☐ │ SR-00142   │ Silk │ ⬤ Ravi │ 0.62 kg │ ₹8,400 │ ⋯     │  ← row
│ ☐ │ SR-00143   │ Silk │ ⬤ Padma│ 0.58 kg │ ₹7,900 │ ⋯     │
├───┴────────────┴──────┴────────┴─────────┴────────┴───────┤
│ FOOTER    aggregates: Total ₹16,300                       │  optional, sticky
├───────────────────────────────────────────────────────────┤
│ PAGINATION   1–25 of 412   [10 ▾]   ‹ ‹ 1 2 3 › ›         │
└───────────────────────────────────────────────────────────┘
```

## D.2 The header spec — the fix

```css
.bk-table thead th {
  /* Typography — Phase 1 `overline` token */
  font-family:    var(--font-ui);        /* Inter — NOT mono */
  font-size:      12px;                  /* was 9–11 */
  font-weight:    600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height:    1.3;

  /* Colour */
  color:      var(--text-tertiary);      /* #69635E — 5.92:1, was 4.11:1 */
  background: var(--surface-sunken);     /* #F5F2EE — headers now have a ground */

  /* Structure */
  height:        44px;                   /* was ~28px implied */
  padding:       0 var(--pad-cell-x);    /* 16 — was 8 */
  text-align:    start;
  white-space:   nowrap;
  border-bottom: 1px solid var(--border-default);

  /* Sticky under the Phase 2 chrome */
  position: sticky;
  top:      var(--shell-chrome-h-full);
  z-index:  var(--z-sticky);
}

.bk-table thead th[data-align="end"]    { text-align: end; }
.bk-table thead th[data-align="center"] { text-align: center; }
```

### Before / after

| | Before | After |
|---|---|---|
| Font family | JetBrains Mono (25 headers) | Inter |
| Font size | 9 / 9.5 / 10 / 10.5 / 11 / 11.5 / 12 / 13 / 13.5 / 14 | **12** |
| Weight | 400–700 mixed | 600 |
| Colour | `#8B7060` — **4.11:1 FAIL** | `#69635E` — **5.92:1 PASS** |
| Background | none / `T.silkCream` | `--surface-sunken` |
| Height | implicit ~28px | 44px |
| Padding-x | 8px | 16px |
| Tracking | `1px` absolute | `0.06em` proportional |

## D.3 Cell spec

```css
.bk-table tbody td {
  font-size:   var(--table-font);        /* 14 default · 13 compact — Phase 2 density */
  color:       var(--text-primary);      /* #1D1814 — 17.60:1 */
  height:      var(--row-h);             /* 48 default · 56 comfortable · 40 compact */
  padding:     var(--pad-cell-y) var(--pad-cell-x);
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.bk-table tbody td[data-type="number"],
.bk-table tbody td[data-type="currency"],
.bk-table tbody td[data-type="percent"] {
  text-align: end;
  font-variant-numeric: tabular-nums lining-nums;
}

.bk-table tbody td[data-type="code"] {
  font-family: var(--font-code);         /* IBM Plex Mono 13 */
  font-size:   var(--text-code-md);
  letter-spacing: 0;
}
```

**Secondary text inside a cell** (a subtitle under a name) is `body-sm` / `--text-tertiary` — never smaller than 13px.

## D.4 Row states

| State | Background | Notes |
|---|---|---|
| rest | `--surface-raised` | |
| hover | `--surface-raised-hover` | 150ms; row actions become fully opaque |
| selected | `--surface-brand-subtle` | + 2px `--border-brand` inline-start |
| focus-within | `--shadow-focus` inset | keyboard row focus |
| disabled | `--surface-disabled`, `--text-disabled` | `aria-disabled` |
| new / updated | `--surface-success-subtle` fading out over 2s | respects reduced-motion |
| error | `--surface-danger-subtle` + `AlertCircle` in the first cell | |

**No zebra striping.** Zebra was a fix for tables without hover states and weak borders. With `--border-subtle` row separators and a hover state, striping adds visual noise and halves the effectiveness of the *selected* background. (Wise, Linear and Stripe all dropped it.)

**Row actions are always in the DOM** — `opacity: 0.6` at rest, `1` on hover/focus-within. Actions that only exist on hover are invisible to keyboard and touch users.

---

# PART E — SORTING, FILTERING, SELECTION

## E.1 Sorting

```
Header (sortable):  SAREE CODE ⇅        rest, --text-tertiary
                    SAREE CODE ↑        asc,  --text-primary + --surface-sunken darkened
                    SAREE CODE ↓        desc
```

| Rule | Spec |
|---|---|
| Whole header is the button | `<th><button>` — 44px hit area |
| Cycle | `none → asc → desc → none` |
| Sort direction by type | text → A–Z first; number/currency/date → **high/recent first** |
| ARIA | `aria-sort="ascending" \| "descending" \| "none"` on the `<th>` |
| Announcement | `aria-live="polite"`: "Sorted by Saree Code, ascending" |
| Multi-sort | `Shift+click` adds a level; a numeric badge shows priority |
| Server-side | Same API, `sortFn` omitted, `onSortChange` fires |

## E.2 Filtering

Toolbar composition (Phase 3 primitives):
```
[SearchInput ────────────]  [Filter ▾] [Filter ▾]  [Density] [Columns] [Export]
```
Active filters render as **`Chip`s** below the toolbar, with "Clear all" past 3.

| Filter type | Control |
|---|---|
| `text` | `SearchInput`, 300ms debounce |
| `select` | `Select` (≤10) / `Combobox` (>10) |
| `multi` | `MultiSelect` with counts per option |
| `range` | Two `NumberInput`s + `Slider` |
| `date-range` | `DateRangePicker` (Phase 5) |

**Filter state lives in the URL** (`?status=pending&weaver=WV-002`). Bookmarkable, shareable, survives refresh, and back/forward works. This is the fix for `CustomersPage`'s 25 `useState` calls.

## E.3 Selection

```
header:  ☐ / ⊟ / ☑   (none / indeterminate / all-on-page)
row:     ☐            48px column, checkbox centred
```
- Header checkbox selects **the current page**; a banner then offers "Select all 412 rows"
- `Shift+click` selects a range
- Selection persists across pages and is announced: `aria-live` → "3 rows selected"
- A **selection action bar** replaces the toolbar when `n > 0`:
  ```
  3 selected   [Export] [Print] [Mark paid]        [✕ Clear]
  ```
  Destructive actions in that bar use `variant="danger-subtle"`, never `danger`.

---

# PART F — THE FIVE TABLE STATES

Currently 14 empty states exist for 327 tables. All five are mandatory in Phase 4.

### 1. Loading
`<TableSkeleton rows={pageSize} columns={columns.length} />` — real header, skeleton bars in cells at each column's actual width. `aria-busy="true"`; `aria-live` announces "Loading sarees" once.

### 2. Empty (no data at all)
```
        ┌─────────┐
        │   📦    │   Icon 48, --text-tertiary
        └─────────┘
     No sarees yet              title-sm, --text-primary
  Add your first saree to       body-md, --text-secondary, max 40ch
  start tracking inventory.
     [ + Add saree ]            Button primary, size lg
```
Padding `--space-16` (64) vertical. Centred.

### 3. Filtered-empty — **distinct from empty**
```
     No sarees match your filters
     Try removing a filter or broadening your search.
     [ Clear all filters ]      Button secondary
```
This is the state your app is missing most often. "No data" when the user has three filters applied reads as data loss and generates support tickets.

### 4. Error
```
     ⚠  Couldn't load sarees
     Check your connection and try again.
     [ Retry ]                  Button secondary
```
`role="alert"`. Keeps the header row so the layout doesn't collapse.

### 5. Populated
The table.

---

# PART G — PAGINATION

`DataPagination` is architecturally sound — keep `usePagination`, restyle and adopt it everywhere.

```
Showing 1–25 of 412        [25 ▾] per page        ‹‹ ‹  1 2 [3] 4 … 17  › ››
```

| Change | From | To |
|---|---|---|
| Local theme block | `T = {taupe:'#8B7060', …}` | Phase 1 tokens |
| `F.mono` for numbers | JetBrains Mono | Inter + tabular figures |
| Page buttons | inline styled | `<IconButton>` / `<Button variant="ghost">` |
| Target size | ~28px | 44px hit area |
| ARIA | none | `<nav aria-label="Pagination">`, `aria-current="page"` |
| Announcement | none | `aria-live`: "Page 3 of 17" |

```
sizes:        [10, 25, 50, 100]   default 25
window:       first · last · current ±2 · ellipsis
keyboard:     ←/→ prev/next when the nav has focus
mobile:       "‹ Prev  3/17  Next ›" only
virtualise:   >200 rows on screen → windowed rows instead of pagination
```

---

# PART H — RESPONSIVE TABLES

## H.1 Three modes, driven by `priority` and `hideBelow`

| Breakpoint | Mode |
|---|---|
| `xl` (1280+) | Full table, all columns |
| `lg` (1024–1279) | Columns with `hideBelow: 'xl'` drop into a row-expand panel |
| `md` (768–1023) | Horizontal scroll container, first column sticky |
| `< md` | **Card list** |

## H.2 Card list — generated from the same `ColumnDef[]`

```
┌──────────────────────────────────────┐
│ SR-00142            ● In Production  │  priority 1 + status
│ Silk · Ravi Kumar                    │  priority 2, --text-secondary
│ ──────────────────────────────────── │
│ Weight  0.62 kg      Price  ₹8,400   │  priority 2, label/value pairs
│ ──────────────────────────────────── │
│ [View]  [Print]                  [⋯] │  actions
└──────────────────────────────────────┘
```
Rendered from `priority` — `1` becomes the title, `2` the body pairs, `3` hides behind "Details". **One source of truth**, so a column added to the table appears on mobile automatically.

## H.3 Horizontal scroll (md)

```css
.bk-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.bk-table-scroll table { min-width: max-content; }   /* stays a real table */

.bk-table [data-sticky="start"] {
  position: sticky; left: 0; z-index: var(--z-raised);
  background: inherit;
  box-shadow: 1px 0 0 var(--border-default);
}
```
This replaces `mobile.css`'s `table { display:block; white-space:nowrap !important }`, which destroyed table semantics (Phase 2, A.3).

---

# PART I — DATAGRID (advanced)

`DataTable` covers ~90% of cases. `DataGrid` extends it for the heavy operational screens (inventory, all-orders, payments reconciliation):

| Capability | Spec |
|---|---|
| Virtualised rows | >200 rows, ~40px estimate, 8-row overscan |
| Column resize | drag handle on the header edge, min 80px, persisted per user |
| Column reorder | drag the header, persisted |
| Column visibility | "Columns" menu, persisted |
| Row expansion | chevron in col 0, panel spans full width, `aria-expanded` |
| Grouping | one level, sticky group headers with counts |
| Inline edit | double-click or `Enter`; `Esc` cancels, `Tab` commits and advances |
| Cell keyboard nav | arrows move the focused cell; `Ctrl+Home/End` to corners |
| Frozen columns | `sticky: 'start' \| 'end'` |

`DataGrid` never renders on mobile — it falls back to the card list.

---

# PART J — METRIC CARD & STAT TILE

## J.1 MetricCard

```
┌────────────────────────────────┐
│ SAREES PRODUCED           [ⓘ]  │  overline 12/600 --text-tertiary
│                                │
│ 248                            │  metric-lg 30/600 Inter tabular
│ ↑ 14%  vs last month           │  label-md 13, --text-success + ArrowUp
│                                │
│ ▁▂▄▆█▆▄                        │  sparkline, optional
└────────────────────────────────┘
```

```
padding:    var(--pad-card)        24
radius:     var(--radius-lg)       12
background: var(--surface-raised)
border:     1px var(--border-default)
shadow:     var(--shadow-sm)
hover:      var(--shadow-md)  (only if the card is clickable)
```

### Critical change: value uses **Inter**, not the display serif

Your current cards render metrics in Fraunces/Plus Jakarta at 44–60px. Phase 1's `metric-lg` is **Inter 30/600 with tabular figures**. Reasons:

1. **Scanning speed.** A KPI row is a comparison task. Serif at 44px+ is a *reading* face; sans at 30px with tabular figures is a *comparison* face.
2. **Alignment.** Tabular figures make `248` / `1,204` / `86` align across a 6-card row. Proportional serif digits don't.
3. **Density.** 30px instead of 60px fits the stat bar above the fold (Phase 2, K).

Fraunces stays for page titles and document letterheads — brand moments, not measurements.

### Delta rules

| Direction | Colour | Icon |
|---|---|---|
| Positive & good | `--text-success` | `ArrowUp` |
| Negative & bad | `--text-danger` | `ArrowDown` |
| Negative & **good** (e.g. defect rate ↓) | `--text-success` | `ArrowDown` |
| No change | `--text-tertiary` | `Minus` |

`invertDelta` prop handles the third case. **Never colour alone** — always arrow + text.

### States
`loading` → `<MetricSkeleton>` (same dimensions, no reflow) · `empty` → `—` in `--text-tertiary` · `error` → `--` + tooltip.

### Container-aware (Phase 2, F.3)
```css
@container card (max-width: 240px) {
  .bk-metric__value { font-size: var(--text-metric-md); }  /* 30 → 24 */
  .bk-metric__spark { display: none; }
}
```

## J.2 StatTile — compact inline variant

```
Overdue          2 invoices  ●
```
For sidebars and card footers. `label-md` label + `metric-sm` value, 40px row, dot for status. Replaces the hand-rolled `ThreeCol.tsx` stat rows.

---

# PART K — THE CHART SYSTEM

## K.1 ChartContainer

Every chart is wrapped. This is what makes 25 files stop hand-rolling tooltips.

```tsx
<ChartContainer
  title="Sarees Produced"
  question="Are we producing more than last month?"   // dev-only; forces D6
  period={<SegmentedControl options={['Week','Month','Quarter']} />}
  height={280}
  series={[
    { key: 'produced',   label: 'Produced'   },   // → --chart-1
    { key: 'dispatched', label: 'Dispatched' },   // → --chart-2
  ]}
  data={data}
  empty={<ChartEmpty />}
  loading={<ChartSkeleton />}
/>
```

**Series colours are assigned by index from the Phase 1 palette.** There is no colour prop. This is what eliminates `fill={T.antiqueGold}` (×11), `fill={T.goldLight}` (×10), and the five-branch ternary chain.

```
--chart-1  #9A2D4A   burgundy    7.37:1
--chart-2  #BA8824   gold        3.17:1
--chart-3  #035181   blue        8.41:1
--chart-4  #C6739C   rose        3.32:1
--chart-5  #047879   teal        5.29:1
```
Adjacent separation 1.60–2.66:1, versus 1.26–1.36:1 in the current pie ramp.

## K.2 Axes

| Property | Spec | Was |
|---|---|---|
| Tick font | **12px** Inter, `--chart-label` `#69635E` (5.92:1) | 8.5–11px |
| Tick line | none | — |
| Axis line | X only, 1px `--chart-axis` | both |
| Gridlines | **horizontal only**, 1px `--chart-grid` `#EAE5E1` | both directions |
| Y baseline | **always zero** for bars/areas | often truncated |
| Y ticks | 4–6 maximum | up to 10 |
| Number format | compact (`1.2L`, `₹8.4k`), tabular | raw |
| X labels | rotate 0° — abbreviate or skip instead of rotating | 45° rotation |

**Truncated Y axes on bar charts are the most common chart lie.** Bars encode magnitude by length; a non-zero baseline makes a 3% change look like 300%. Line charts *may* truncate (they encode change), but must show it.

## K.3 Tooltip

```
background:  --chart-tooltip-bg   #1D1814
color:       --chart-tooltip-fg   #FAF8F6
font:        body-sm 13
padding:     10px 12px
radius:      --radius-md  8
shadow:      --shadow-lg
z-index:     --z-tooltip

┌──────────────────────┐
│ March 2026           │  label-sm 12, 70% opacity
│ ● Produced      248  │  dot + label + tabular value
│ ● Dispatched    213  │
│ ─────────────────────│
│   Total         461  │  optional
└──────────────────────┘
```
Shared crosshair across series. Follows the cursor with 60ms easing. **Dismissible with `Esc`** (WCAG 1.4.13). Touch: tap to pin, tap outside to dismiss.

## K.4 Legend

```
● Produced   ● Dispatched
```
| Rule | Spec |
|---|---|
| Position | Top-right for ≤3 series; bottom-left for 4+ |
| Type | `label-md` 13, `--text-secondary` |
| Marker | 8px dot (bar/area) or 12×2 line segment (line) |
| Interactive | Click toggles series; `aria-pressed`; dimmed when off |
| **Omit** when | ≤2 series can be labelled directly on the marks |

**Direct labelling beats a legend.** A legend forces a colour→name lookup for every glance. Label the last point of a line, or the bar itself, and the legend disappears.

## K.5 Chart-type selection (D6)

| Question | Chart | Notes |
|---|---|---|
| How much, compared across categories? | **Bar** (vertical) | ≤8 categories |
| Same, but long labels / many categories? | **Bar** (horizontal) | sorted by value |
| How has it changed over time? | **Line** | ≥7 points |
| Change over time, few points? | **Bar** | <7 points — lines imply continuity that isn't there |
| Cumulative total over time? | **Area** | single series, zero baseline |
| Composition over time? | **Stacked bar** | ≤4 segments |
| Part-to-whole, one moment? | **Bar**, not pie | see below |
| Progress toward a target? | **Progress bar** or **radial gauge** | one number |
| Relationship between two measures? | **Scatter** | |
| Distribution? | **Histogram** | |

### On pie charts

You have **21 `<Pie>` instances**. Humans compare angles poorly — a sorted horizontal bar chart answers the same question faster and more accurately. Phase 4's rule:

- **Pie/donut permitted only for:** ≤4 slices, part-of-a-whole, where the *proportion* is the message (e.g. "72% of production is complete").
- **Every slice must be directly labelled** with its percentage. No legend-only pies.
- **Never** for ranking, comparison across time, or >4 categories.
- The 5-slice ternary-chain pies convert to sorted horizontal bars.

Donut with a centre KPI (your `Donut` in `beere-dashboard/ui.tsx`) is a legitimate exception — it's a gauge, not a pie.

## K.6 Chart states

| State | Render |
|---|---|
| loading | `<ChartSkeleton>` — real axes, shimmer plot area, exact height |
| empty | Axes retained + "No data for this period" + `[Change period]` |
| error | "Couldn't load chart" + `[Retry]`, `role="alert"` |
| partial | Render what exists; a dashed segment marks the gap, footnote explains |

## K.7 Chart accessibility

Recharts renders SVG that screen readers cannot interpret. Required on every chart:

```tsx
<figure role="group" aria-labelledby={titleId} aria-describedby={summaryId}>
  <figcaption id={titleId}>Sarees Produced</figcaption>
  <p id={summaryId} className="sr-only">
    Bar chart. Produced rose from 198 in January to 248 in March, up 14%.
    Dispatched rose from 176 to 213.
  </p>
  {chart}
  <details>
    <summary>View as table</summary>
    <DataTable columns={…} data={data} />          {/* the same data */}
  </details>
</figure>
```

- `aria-describedby` gives a **prose summary of the trend**, not the raw numbers.
- **"View as table"** is the reliable fallback — and it costs nothing, because `ColumnDef` already exists.
- Line series get distinct `strokeDasharray` patterns so they separate without colour.
- Bar patterns (`<pattern>` fills) for stacked charts printed in greyscale.

---

# PART L — SPARKLINE, PROGRESS, GAUGE

## L.1 Sparkline
```
width:  fill container   height: 32 (card) · 24 (table cell)
stroke: 1.5px --chart-1  fill: gradient --chart-1 @ 12% → 0%
axes:   none    ticks: none    tooltip: none
endpoint dot: 3px, last value only
aria-hidden: true    ← always paired with a visible number
```
A sparkline is a shape, not a chart. It never carries a value alone.

## L.2 Progress (data context)
Extends the Phase 3 `Progress`:
```
label above:  "Batch 086"           label-md
value right:  "72%"                 label-md tabular
bar:          6px, --surface-brand
target mark:  2px vertical --border-strong at the goal
over-target:  --text-success
```
`ThreeCol.tsx`'s three hardcoded bars (`#6B1A2A`, `#C4923A`, `#A0506A`) all become `intent="brand"` — per Phase 1, gold and mauve don't encode data.

## L.3 Radial gauge
```
Single metric, 0–100%. Track --bk-neutral-200, arc --surface-brand,
270° sweep, centre value metric-md tabular + caption label.
Never for absolute counts — only bounded percentages.
```

---

# PART M — IMPLEMENTATION PLAN

### Step 1 — Fix `<th>` globally *(2 hours, biggest single win)*
Before any component work, land the header style. Two paths run in parallel:

```bash
# A. the shared primitive (Phase 1 Step 5 already staged this)
#    shared/ui/table.tsx → TableHead / TableCell

# B. the 300 inline <th> elements
rg -n "fontFamily: F\.mono" frontend/src/features --glob '*.tsx' -A3 | rg -B1 "<th|th style"
```
Replace every `<th>` style block with the Part D.2 spec. This alone resolves the reported bug across 56 files.

### Step 2 — Build the data layer *(4–5 days)*
```
shared/ui/data/
  DataTable.tsx     TableSkeleton.tsx   TableEmpty.tsx
  DataGrid.tsx      columns.ts          useTableState.ts
  CardList.tsx      Pagination.tsx      (restyled DataPagination)
  MetricCard.tsx    StatTile.tsx        Sparkline.tsx
  ChartContainer.tsx ChartTooltip.tsx   ChartLegend.tsx
  ChartSkeleton.tsx ChartEmpty.tsx      chartTheme.ts
  formatters.ts     (₹, lakh/crore, dates, percent)
  index.ts
```
`useTableState` owns sort + filter + selection + pagination and syncs to the URL.

### Step 3 — Migrate one table end-to-end *(1 day)*
`features/inventory` — it contains the 9px-mono-taupe header, 12 columns, and pagination. Proves the `ColumnDef` API against a hard case.

### Step 4 — The 262 grid-tables *(2 weeks, incremental)*
```bash
rg -c 'gridTemplateColumns: "[0-9a-z. ]*fr' frontend/src/features   # 262
```
Triage each:
- **Tabular data** (a header row + repeating rows) → `DataTable`. Most of them.
- **Genuine layout** (a form row, a card grid) → Phase 2 layout recipes.

Sort by column count descending — `"2fr 130px 130px 150px 80px 36px"` is unambiguously a table.

### Step 5 — Charts *(1 week)*
```bash
rg -l "recharts" frontend/src/features   # 25 files
rg -n "fill=\{T\.antiqueGold\}|fill=\{T\.goldLight\}" frontend/src   # 21 sites
rg -n "i === 0 \? T\.royalBurgundy"  frontend/src                    # the ternary chain
```
Order: (1) delete all colour props → `ChartContainer` assigns by index; (2) raise every axis `fontSize` to 12; (3) convert 5-slice pies to sorted horizontal bars; (4) add `figure`/`figcaption`/summary/"View as table".

### Step 6 — Pagination rollout *(2 days)*
Restyle `DataPagination` to Phase 1 tokens (drop its local `T`/`F` block), then replace the 14 inline `pageSize`/`currentPage` reimplementations.

### Step 7 — Enforce *(1 hour)*
```js
'no-restricted-syntax': [
  'error',
  { selector: 'JSXOpeningElement[name.name="table"]',
    message: 'Use <DataTable> from shared/ui/data.' },
  { selector: 'JSXOpeningElement[name.name="th"]',
    message: 'Columns are declared via ColumnDef, not <th>.' },
  { selector: 'JSXAttribute[name.name="fill"][value.expression.property.name=/gold/i]',
    message: 'Gold is decorative. Chart series come from --chart-N.' },
],
```

---

# PART N — DEFINITION OF DONE

- [ ] `rg "fontFamily: F\.mono" ` returns **0** results inside any `<th>`
- [ ] No `<th>` renders below **12px**
- [ ] No `<th>` uses `#8B7060`; all use `--text-tertiary` (5.92:1)
- [ ] Every `<th>` has `scope="col"` and `aria-sort` when sortable
- [ ] `rg "<table"` in `features/` → **0** (all via `DataTable`)
- [ ] Grid-tables reduced from 262 to **<60** (remaining ones are genuine layout)
- [ ] Every table has all **five** states, including filtered-empty
- [ ] Every table is sortable on at least its primary columns
- [ ] Every numeric column is right-aligned with tabular figures
- [ ] Pagination is `DataPagination` everywhere; 0 inline reimplementations
- [ ] `rg "fill=\{T\.antiqueGold\}|fill=\{T\.goldLight\}"` → **0**
- [ ] The 5-branch pie ternary chain is deleted
- [ ] Every chart axis label ≥ **12px**
- [ ] Every chart has `figure` + `figcaption` + prose summary + "View as table"
- [ ] All Y axes on bar/area charts start at zero
- [ ] MetricCard values use Inter + tabular figures, not the display serif
- [ ] `npm run typecheck && npm run lint && npm run build` clean

---

# PART O — WHAT PHASE 4 DOES *NOT* DO

- ❌ Filter dropdowns, date-range picker, calendar — **Phase 5** (Phase 4 defines the `filterType` contract they satisfy)
- ❌ Toast on save, confirmation modals — **Phase 5**
- ❌ The domain status taxonomy (~30 real states → 6 tones) — **Phase 6**
- ❌ Entity-code formatting and masks — **Phase 6** (Phase 4 supplies `type: 'code'`)
- ❌ Currency locale rules (lakh vs million) — **Phase 6** (Phase 4 supplies `type: 'currency'`)
- ❌ Print/PDF table layout, invoice line-item tables — **Phase 7** (Phase 4's `printable` flag feeds it)
- ❌ Executing the 262-grid-table codemod — **Phase 8**

---

## What Phase 4 eliminates

| Before | After |
|---|---|
| **9px monospace headers at 4.11:1** | 12px Inter at **5.92:1** |
| 10 header font sizes; 30/51 below 12px | 1 token, 12px |
| 25 headers in JetBrains Mono | 0 — mono only in `type: 'code'` cells |
| 65 `<table>` + 262 grid-tables, 0 shared | 1 `DataTable` |
| 262 "tables" with no table semantics | Real `<table>`, `scope`, `aria-sort` |
| 18 sortable columns / 327 tables | Sortable by default |
| 14 empty states / 327 tables | 5 mandatory states per table |
| Pagination in 6 of 56 table files | Universal, tokenised, ARIA-complete |
| 21 chart marks in gold (2.55:1 / 1.61:1) | Palette assigned by index, all validated |
| Pie ramp with 1.26–1.36:1 adjacent slices | 1.60–2.66:1 adjacent separation |
| 248 chart labels below 12px | 12px floor |
| Charts unreadable to screen readers | `figure` + summary + "View as table" |
| Metrics in 44–60px serif | 30px Inter, tabular, above the fold |
