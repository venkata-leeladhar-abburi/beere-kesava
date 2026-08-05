# Beere Keshava & Brothers — Design System
## Master Roadmap

> **Codename:** `BK Loom` — the design system for the Beere Keshava & Brothers silk ERP.
> **Positioning:** Premium heritage-craft brand meeting a dense, high-frequency operations tool.
> Elegance must never cost legibility. Every decorative decision is subordinate to the operator
> who has to read 400 rows of saree data at 9pm.

---

## Why this needed to be phased

The audit (Section 2 of `01-FOUNDATIONS.md`) found a codebase with:

| Metric | Finding |
|---|---|
| `.tsx` files | 507 |
| Files using inline `style={{}}` | **412 (81%)** |
| Duplicated local `theme.ts` / `theme.tsx` files | **21** |
| Font families loaded over the network | **9** |
| Hardcoded hex literals in feature code | 600+ occurrences |
| Design-token file (`theme.css`) actually connected to the brand | **0 of 40 tokens** |

You cannot fix a system this size with one commit. Rebuilding it in one pass would mean
touching 412 files simultaneously with no way to review, no way to roll back, and no way
to tell a regression from an intended change.

So the work is split into **8 phases**. Each phase ends with something *shippable and
visible*, and each phase depends only on the phases before it.

---

## The 8 phases

### ▸ Phase 1 — Foundations *(this phase — delivered)*
**The primitive + semantic token layer. The single source of truth.**

- Full audit with measured WCAG numbers (not opinions)
- Colour: 7 perceptually-even ramps derived from your Overview-page chart colours
- Semantic colour layer (surface / text / border / brand / status / chart)
- Typography: font decision, 3-family stack, 12-step type scale, weight & tracking rules
- Spacing (4pt grid), radius, elevation, motion, z-index, breakpoint tokens
- **Ships:** `tokens.css`, `tokens.ts`, `fonts.css`, and a live token-preview page

**Deliverables:** `design-system/01-FOUNDATIONS.md`, `frontend/src/styles/tokens.css`,
`frontend/src/design-system/tokens.ts`, `frontend/src/styles/fonts.css`

---

### ▸ Phase 2 — Layout & Page Architecture
**Fix the structural problems before styling anything.**

- The `AppShell`: nav rail / top nav / content / footer regions with defined heights
- Page template contract: `PageHeader` → `StatBar` → `Toolbar` → `Content` → `Footer`
- 12-column responsive grid, container max-widths, gutters, section rhythm
- Replaces the hardcoded `margin: "36px 48px 0"` / `height: calc(100vh - 90px - 160px)`
  arithmetic scattered across pages
- Density modes (comfortable / compact) for data-heavy screens
- Responsive strategy: breakpoint behaviour per region, mobile nav, safe areas
- Laws of UX applied: Law of Proximity (grouping), Miller's Law (nav chunking),
  Jakob's Law (conventional placement), Fitts's Law (target sizing)

---

### ▸ Phase 3 — Core Primitives
Button (7 variants × 4 sizes × 6 states), Input, Textarea, Select, Checkbox, Radio,
Switch, Slider, Label, Field wrapper, Badge, Tag, Chip, Avatar, Icon system,
Tooltip, Divider, Skeleton, Spinner. Full state matrix + focus-visible spec.

---

### ▸ Phase 4 — Data Display
**The biggest usability win.** Table (the header-contrast bug lives here), DataGrid,
column types (text / numeric / currency / date / code / status / actions), sorting,
sticky headers, row density, zebra rules, empty / loading / error states,
Pagination, Metric Card, Stat Tile, Progress, Sparkline, and the **Chart system**
(axes, gridlines, tooltips, legends, series colour assignment).

---

### ▸ Phase 5 — Navigation, Overlays & Feedback
Top nav, nav rail, group tabs, breadcrumbs, Command palette, Search, Dropdown menu,
Modal / Dialog / Drawer / Sheet, Popover, Toast & Notification centre, Alert,
Banner, Confirmation patterns, Filter bar, Date picker, Date-range picker,
month/year navigation, Calendar.

---

### ▸ Phase 6 — Domain Patterns
The parts unique to your business: **Entity Code system** (weaver `WV-002`,
batch `BATCH-086`, saree codes, invoice numbers, PO numbers, quotation numbers) —
typography, formatting, colour, copy-to-clipboard affordance, truncation rules.
Plus status taxonomies (order / production / QC / payment lifecycles),
currency & number formatting (₹, lakh/crore, tabular figures),
weaver / customer / supplier cards, image handling.

---

### ▸ Phase 7 — Document System
**Print & PDF design language.** Invoice, Quotation, Purchase Order, Delivery Challan,
Payment Receipt, Statement of Account. Page geometry, print type scale, mono-safe
tabular columns, letterhead, seal/signature blocks, GST layout, terms blocks,
`@media print` rules, and PDF-safe colour (no oklch, no CSS variables).

---

### ▸ Phase 8 — Migration, Governance & Enforcement
The mechanical rollout: codemods to kill the 21 local `theme.ts` files and 600+ hex
literals, ESLint rules banning raw hex/px in feature code, a Storybook-equivalent
component gallery, contrast CI check, visual regression, versioning, and the
contribution guide.

---

## Dependency graph

```
Phase 1 (Foundations)
   │
   ├──► Phase 2 (Layout)  ──┐
   │                        │
   ├──► Phase 3 (Primitives)┤
   │                        ├──► Phase 6 (Domain) ──► Phase 7 (Documents)
   ├──► Phase 4 (Data)   ───┤                                │
   │                        │                                │
   └──► Phase 5 (Nav/Overlay)┘                               │
                            │                                │
                            └──────► Phase 8 (Migration) ◄────┘
```

Phases 3, 4 and 5 are independent of each other and can run in parallel.

---

## Ground rules that hold across every phase

1. **Measured, not asserted.** Every colour pair in this system has a computed WCAG
   ratio recorded next to it. No "looks fine to me."
2. **Two layers of tokens, always.** Primitives (`--bk-burgundy-700`) are never used in
   a component. Components consume semantics (`--text-brand`). This is what makes
   dark mode and re-theming a config change rather than a rewrite.
3. **Decoration is opt-in, legibility is default.** Gold, gradients, and serif type are
   accents applied deliberately — never the carrier of information.
4. **One family per role.** One display face, one UI face, one code face. Nine is a bug.
5. **Nothing below 12px** renders text in the product. Ever.
6. **Every interactive target ≥ 44×44 CSS px** of hit area (Fitts's Law / WCAG 2.5.8).
7. **Motion respects `prefers-reduced-motion`** without exception.

---

*Phase 1 begins in [`01-FOUNDATIONS.md`](./01-FOUNDATIONS.md).*
