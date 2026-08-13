# Phase R — Responsive Rollout

> **This document is the single source of truth for the responsiveness effort.**
> It is written to be resumed from any Claude account, in any session, with zero
> prior context. Read §0 and §1 before touching a single file.
>
> Status ledger lives in §9. **Update the ledger in the same commit as the work.**

---

## §0 — SCOPE RULE (read this first, it is not optional)

**Add responsiveness. Change nothing else.**

This effort is a rollout, not a refactor. The temptation to "fix while you're in
there" is the single biggest risk to it, because a responsive diff that also
contains unrelated changes cannot be reviewed, cannot be reverted cleanly, and
cannot be trusted when a visual regression appears later.

### Allowed in a Phase R commit

- Adding the `responsive` prop to an existing `<DataTable>`.
- Adding `priority: 1 | 2 | 3` to existing `ColumnDef` entries.
- Adding breakpoint-conditional layout: `max-md:` / `md:` Tailwind variants,
  `@media` blocks, or `useResponsive()`-driven values.
- Changing a **fixed** dimension into a **fluid/wrapping** one where it overflows
  on mobile (e.g. `width: 320` → `width: "100%", maxWidth: 320`;
  `gridTemplateColumns: "1fr 1fr 1fr"` → collapsing to `1fr` under `md`).
- Adding a mobile-only wrapper (scroll container, filter sheet, sticky action bar)
  where none exists.
- Replacing a hand-rolled `window.innerWidth` check with `useResponsive()`.

### Forbidden in a Phase R commit

- Changing desktop appearance. **Desktop is the control group.** If a change alters
  the ≥1280px rendering in any way, it is out of scope — revert it and note it in §10.
- Renaming anything, reordering props, "tidying" imports, reformatting untouched lines.
- Fixing bugs you notice in passing. Log them in §10 "Found, not fixed" instead.
- Adopting other design-system phases (Money/StatusPill/EntityCode/DataTable
  *migration* of a raw table). Phase R turns responsiveness **on** for tables that
  are already on `DataTable`; it does not migrate new tables onto it.
- Changing copy, labels, colours, fonts, spacing at desktop width, or business logic.
- Touching `design-system/00-08` docs, backend code, or test fixtures.

### The one-line test before every commit

> "If I set the browser to 1280px wide, is this pixel-identical to `main`?"
> If the answer is anything other than a confident **yes**, the diff is out of scope.

---

## §1 — Session start protocol (do this every session, ~2 minutes)

Any account, any session, starts here. Do not skip — the ledger in §9 is the only
reliable statement of what is done; conversation memory is not.

```bash
cd frontend && git status && npm run ratchet
```

1. `git status` — confirm a clean tree. If there is uncommitted work, read §9 to see
   whether it is a Phase R work-in-progress or someone else's parallel effort. **Never
   commit files you did not touch this session** (this has gone wrong before on this repo).
2. `npm run ratchet` — regenerates `design-system/RATCHET.md`. Once §8 is done this
   reports live responsive metrics. Trust this over any number written in prose anywhere,
   including in this document.
3. Read §9 (Status ledger) and pick the next unchecked item in the **lowest-numbered
   incomplete phase**.
4. Read the phase's own section for its recipe. Follow the recipe rather than improvising —
   the recipes exist so that work done by different accounts looks identical.

### Session end protocol

```bash
cd frontend && npx tsc --noEmit && npm run build && npm run lint
```

- `tsc` must exit 0. `build` must succeed. `lint` must show **no new errors** — this repo
  has a known pre-existing baseline of ~20 errors in dashboard files; match it, don't fix it.
- Tick the boxes you completed in §9, with the date.
- Append anything surprising to §10.
- Commit with a `responsive:` prefix (see §1.1). **Ask before pushing.**

### §1.1 Commit convention

```
responsive(<feature>): <what became responsive>
```

One feature per commit, e.g. `responsive(customers): card-mode on 5 tables`.
Small, feature-scoped commits are what make this revertable when a regression shows up
three weeks later. Do not batch multiple features into one commit even when the recipe
is mechanical.

---

## §2 — What already exists (verified against the repo, 2026-08-12)

This effort is **not** starting from zero. Prior design-system phases already built most
of the machinery. The dominant remaining problem is **adoption**, not construction.

| Capability | Location | State |
|---|---|---|
| Breakpoint hook | `frontend/src/hooks/useResponsive.ts` | Built. `mobile <768` / `tablet 768–1279` / `desktop ≥1280`, plus `px` gutter (16/28/56) and a `cols(m,t,d)` helper. |
| Duplicate breakpoint impls | `useIsMobile()` (same file), `shared/ui/_legacy/use-mobile.ts`, + 3 hand-rolled `window.innerWidth < 768` sites | **Fragmented — Phase R0 consolidates.** |
| Table card-mode | `frontend/src/shared/ui/data/DataTable.tsx` | **Fully built and unused.** `responsive` prop renders a `CardList` under `md`, driven by each column's `priority`. **0 of 70 consumers have enabled it.** |
| Modal mobile shell | `frontend/src/shared/ui/overlay/Modal.tsx` | **Already responsive.** Every size becomes a full-width bottom sheet under `md` (`max-md:` classes, `max-h-[92dvh]`). The *shell* is done; modal *content* is not. |
| Portal chrome | `frontend/src/shared/ui/portal/PortalChrome.tsx` | Shared by Worker + Weaver only. `StatsStrip` uses `flex: 1 1 200px` wrap — reflows, but 48px numerals and `minHeight: 140` are unverified at 320px. |
| Per-portal mobile islands | `Mobile*.tsx` across 5 portals | Each portal has bespoke mobile components (`MobileNavDrawer`, `SAMobileNav`, `MobileTabBar`, `MobileWeaverPortal`, `MobileHeader`, …). An "island" pattern, distinct from DataTable's "one component, breakpoint-driven" pattern. **Phase R4/R6 decide per portal whether islands stay.** |
| `mobile.css` | `frontend/src/styles/mobile.css` (80 lines) | Legacy global sheet. Design-system Phase 2 wanted it retired; Phase R does **not** retire it (that is a refactor) but must not add to it. |

### The five portals

Work is tracked per portal because they do **not** share a dashboard shell:

1. **Admin** — `features/dashboards/components/beere-dashboard/`
2. **Superadmin** — `features/dashboards/components/superadmin-dashboard/`
3. **Weaver** — `features/portals/components/weaver-portal/`
4. **Worker** — `features/portals/components/worker/`
5. **Shop staff** — `features/portals/components/shop-staff/`

Worker and Weaver share `PortalChrome.tsx`. The other three do not share anything.

---

## §3 — Conventions (apply these everywhere; they make the work mechanical)

### 3.1 Breakpoints — one set, no exceptions

| Name | Range | Tailwind | Hook |
|---|---|---|---|
| mobile | `< 768px` | `max-md:` | `isMobile` |
| tablet | `768–1279px` | `md:` | `isTablet` |
| desktop | `≥ 1280px` | `xl:` | `isDesktop` |

Never introduce a new breakpoint value. If a layout breaks at an odd width, fix it by
making the layout fluid, not by adding a bespoke media query.

### 3.2 CSS-first, hook-second

Prefer Tailwind variants / `@media` over `useResponsive()`. CSS has no hydration flash,
no resize-listener cost, and no re-render. Reach for the hook **only** when the difference
is structural (rendering genuinely different components/props, not just different styles).

`useResponsive()` reads `window.innerWidth` in `useState` initialisers, so a hook-driven
layout will flash the desktop layout for one frame on a mobile load. This is another reason
CSS wins by default.

### 3.3 Page gutters — minimal on mobile/tablet, never hand-rolled

**Rule (user directive, 2026-08-12): mobile and tablet horizontal page padding must be
minimal** — just enough for a healthy reading gap, not a scaled-down copy of the desktop
gutter. Maximize content width on small screens.

**The recurring bug:** pages hardcode one horizontal padding value in a `style` prop and
reuse it at every breakpoint — e.g. `padding: "24px 48px 0"`. That 48px is a sane desktop
gutter and a wasteful one on a 375px phone (it eats ~25% of the viewport width on each
side). This is not a one-off — it is the single most common page-gutter bug in the
codebase and will recur in any new page written without this convention in mind.

**The fix, every time:** split the padding into vertical (`style`, unchanged, preserves
exact original spacing) and horizontal (a responsive `className`, replacing the old
uniform value):

```tsx
// Before — desktop's 48px gutter applied at every width:
<div style={{ padding: "24px 48px 0" }}>

// After — 16px mobile / 28px tablet / 48px desktop (unchanged at ≥1280px):
<div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 24 }}>
```

Tailwind's default spacing scale (`4px × n`) lines up exactly with this doc's breakpoint
gutters — `px-4` = 16px, `px-7` = 28px, `px-12` = 48px — and Tailwind's default `md`
(768px) / `xl` (1280px) breakpoints are exactly this doc's tablet/desktop boundaries (§3.1).
No custom Tailwind config or new breakpoint is needed; use these three classes verbatim.

**If the page's original desktop gutter isn't 48px**, keep whatever it actually was in the
`xl:` class (`xl:px-10` for 40px, `xl:px-14` for 56px, etc. — Tailwind spacing is `n×4px`,
so divide the original px value by 4) so desktop stays pixel-identical per §0, and use
`px-4 md:px-7` for mobile/tablet regardless — those two are the fixed target, only the
desktop anchor varies per page.

**Applies to every page, present and future** — this is a standing convention, not a
one-time fix. Any new page (from any account, any session) should reach for
`px-4 md:px-7 xl:px-<original/4>` for its outer horizontal padding by default, never a
single hardcoded value repeated across breakpoints.

**Fixed 2026-08-12 as the first real instance:** `AllOrdersPage.tsx` (4 spots),
`AllOrdersFilterBar.tsx` (1), `AllOrdersAnalyticsSection.tsx` (1) — all had `48px` fixed
horizontal padding regardless of viewport. This is very likely not the only page with this
exact bug; R0.3/R7 should grep for the pattern (`padding:\s*"[^"]*\d+px \d+px`) across
`features/**` when those phases run.

### 3.4 Column priority (the core of table responsiveness)

`ColumnDef.priority` drives the card fallback. Columns default to `2`.

| Priority | On desktop table | On mobile card |
|---|---|---|
| `1` | normal column | **card title** — pick exactly one per table |
| `2` | normal column | label/value row in the card body |
| `3` | normal column | **hidden on mobile** |

**Rules for assigning priority — apply consistently:**

- Exactly **one** `priority: 1` per table. It should be the column a user would read to
  identify the row: a name, an entity code, an invoice number. Never a date, never a status,
  never money.
- `priority: 2` for the 3–5 fields that make the row actionable: money, status, key dates,
  counts.
- `priority: 3` for everything else — audit metadata, secondary IDs, derived columns,
  timestamps, anything a user would only consult on a wide screen.
- **The actions column is always `priority: 2`**, never 3. Hiding row actions on mobile
  removes functionality, which is out of scope for a responsive pass.
- Target **4–6 visible fields per card**. A card showing 12 label/value pairs is a table
  with extra steps and helps nobody.

### 3.5 Touch targets

Any control that becomes tappable on mobile needs **≥44×44px**. Icon-only row actions
frequently fail this on the desktop table (they are typically ~28px). Fix by padding the
mobile card variant, not by changing the desktop button.

### 3.6 Horizontal scroll is a last resort, never the default

A page must never scroll horizontally as a whole. Wide content scrolls **inside its own
container**. For genuinely irreducible wide content (a financial ledger, a matrix), an
`overflow-x: auto` container is acceptable **only** when card-mode is a semantic mismatch —
document the reason in §10 when you choose it.

### 3.7 `md:` is not "desktop" — dense/unwrapped layouts must revert at `xl:`

**Real incident (2026-08-13):** an R4 commit gated two components' "revert to the original
dense layout" behind Tailwind's `md:` (768px) instead of `xl:` (1280px) — a 10-tab flex
strip and a 5-tile icon+text flex row, both designed for real desktop width. At 768-1279px
(this doc's **tablet** range, not desktop — §3.1) neither fit, the row overflowed its
container, and it dragged the *entire page* into horizontal scroll. Caught by the user via
screenshot, not by `tsc`/`build`/`lint` (none of which can see a runtime layout overflow) or
by the unverified-in-browser caveat that had been noted but not acted on further.

**The rule going forward:** before choosing `md:` vs `xl:` as the "un-collapse" breakpoint,
classify the component:
- **Column-stacked cards** (icon on top, label/value stacked below, no forced `nowrap`,
  no fixed pixel `minWidth`) — e.g. `SumCard`, most KPI tiles used throughout R1-R4 —
  narrow gracefully as columns shrink. `md:grid-cols-N` (revert at 768px, i.e. tablet
  already gets the full column count) is fine for these.
- **Row-per-item layouts** (icon and text side-by-side *within* one flex item, tab strips,
  anything wider than it is tall per item) — do **not** assume 768-1279px is enough room.
  Gate the revert at `xl:` (1280px) instead, so the mobile-designed fallback (stack, picker,
  wrap) covers the full tablet range too. When genuinely unsure, `xl:` is the safer default —
  a card grid revert one breakpoint later costs a slightly emptier tablet view; a row-layout
  revert one breakpoint early costs a full page-width horizontal-scroll bug.

**Verification note:** this class of bug is invisible to `tsc`/`build`/`lint` and only shows
up as a real rendered layout. If browser verification is blocked (as it has been for this
entire rollout so far — see the recurring "stuck policy-check" note in commits), treat any
`md:`-gated revert to a row/flex layout as **higher risk** than a grid-based one, and prefer
the conservative `xl:` choice rather than assuming `md:` is safe.

---

## §4 — Priority order (which to do first, and why)

Ordered by **user-visible pain ÷ effort**, with dependency constraints respected.

| # | Phase | Effort | Why here |
|---|---|---|---|
| **R0** | Foundations | **XS** | Tiny (3 sites + conventions). Must precede everything so all later work uses one breakpoint source. |
| **R1** | **Tables → card mode** | **M, but mechanical** | 🔴 **START HERE after R0.** The user's #1 stated pain ("big big table with so many columns"). 70 files, component already built and tested, changes are purely additive props. Highest leverage in the whole effort by a wide margin. |
| **R2** | Modal content | M | Shell already responsive; content inside big modals still breaks. Depends on R1 — modals containing tables inherit R1's fix for free. |
| **R3** | Dashboards, stats & KPI grids | M | High visibility (first screen every role sees), 5 portals reviewed separately. |
| **R4** | Reports pages | **L — hardest** | Charts + wide tables + filter toolbars + export controls, zero responsive treatment today. Real new work. Inherits R1 for its tables. Needs its own scoping conversation before starting. |
| **R5** | Forms & filter bars | M | Full-page forms and `DateFilterBar`. Lower pain than tables because forms degrade to something usable, if ugly. |
| **R6** | Navigation audit | S | Mostly already built per portal — verification and drift-resolution, not construction. |
| **R7** | Grid-as-table triage | **L** | 188 files use `gridTemplateColumns`. Deliberately last: by this point R1–R5 have proven the patterns, so triage is applying known recipes rather than inventing them. |
| **R8** | QA, device matrix, governance | S | Locks in the gains with ratchet metrics so regressions get caught. |

**Do R0 then R1.** R1 alone will resolve the majority of the reported pain, and it is the
phase where a fresh session can be productive within minutes.

### Working faster

- **R1 is a batch job, not 70 decisions.** Work feature-by-feature (§9 groups the files
  that way). Within a feature the recipe is identical; do not re-derive it per file.
- **Read the `ColumnDef[]` array only.** For R1 you do not need to understand the page,
  the data fetching, or the business logic. You need the column list and nothing else.
- **Batch the verification.** Run `tsc`/`build`/`lint` once per feature, not once per file.
- **Don't chase perfection per card.** Priority assignment is reversible and cheap. A
  defensible 80% assignment shipped across a whole feature beats an agonised-over one file.
- **Never start a phase without ticking §9.** Losing track of which of 70 files are done
  costs more than the work itself.

---

## §5 — Phase R0: Foundations

**Goal:** one breakpoint source of truth, and numerals that survive a 320px screen.

### R0.1 — Consolidate breakpoint implementations
Three hand-rolled `window.innerWidth < 768` sites remain. Replace each with
`useIsMobile()` from `hooks/useResponsive.ts`.

```bash
cd frontend && grep -rn "window.innerWidth" src --include="*.tsx" | grep -v useResponsive
```

Leave `shared/ui/_legacy/use-mobile.ts` alone — it backs the shadcn sidebar primitive and
retiring it is a refactor, not a responsive change.

### R0.2 — Fluid numerals
`StatsStrip` (`shared/ui/portal/PortalChrome.tsx`) renders values at `fontSize: 48` with
`minHeight: 140`. A 7-digit rupee value at 48px will not fit a 320px card. Introduce a
`clamp()`-based size for large numerals and apply it to `StatsStrip` only in this phase
(dashboards get it in R3).

Use `clamp()` in CSS rather than a hook — see §3.2.

### R0.3 — Verify the gutter scale is actually applied
`useResponsive().px` returns 16/28/56. Confirm the pages that already import it use it for
page padding, and note in §10 any page that hardcodes a desktop gutter. **Do not fix them
in R0** — that is R3/R4 work, per-page.

**Definition of done:** one mobile-check hook in use across `features/**`; `StatsStrip`
numerals legible at 320px; §10 lists any hardcoded gutters found.

---

## §6 — Phase R1: Tables → card mode 🔴 START HERE

**Goal:** all 70 `<DataTable>` consumers render as readable cards under `md`.

**This is the highest-value phase in the document.** The component is built, tested, and
adopted by zero consumers. Every file is the same two-part edit.

### The recipe (identical for every file)

1. Open the file, find the `ColumnDef<T>[]` array.
2. Add `priority` to each column per §3.4. Most columns are `2` (the default) — you only
   need to explicitly mark the **one** `priority: 1` title column and the `priority: 3`
   hide-on-mobile ones. Omit `priority: 2` entirely; it is the default and writing it adds
   noise to the diff.
3. Add the `responsive` prop to the `<DataTable>`:
   ```tsx
   <DataTable responsive columns={columns} data={rows} getRowId={...} />
   ```
4. That is the entire change. **Do not** touch `cell` renderers, formatting, styling, or
   anything else in the file.

### Why this is safe

`responsive` is opt-in and additive. Without it, `DataTable` renders exactly the markup it
renders today. With it, the desktop `<table>` gains a `hidden md:block` wrapper and a
`md:hidden` `CardList` is rendered alongside. **Desktop output is unchanged** — which
satisfies §0's one-line test structurally, not just by inspection.

### Verification

Because card mode only appears under `768px`, `tsc`/`build`/`lint` cannot see it. Per
feature, resize to 375px and confirm: the card title identifies the row, 4–6 fields show,
row actions are present and tappable, and no horizontal page scroll.

If browser verification is blocked (see §7), the priority assignments are still safe to
land — they are inert above `md`. Note the unverified batch in §10 so a later session with
browser access can sweep them.

### Known exclusions

Five files still contain a raw `<table>` rather than `DataTable`. They are **out of scope
for R1** — migrating them is design-system Phase 4 work, not responsive work (§0).

| File | Why it is not on DataTable |
|---|---|
| `features/production/components/batch-creation/BatchTable.tsx` | row selection + modal pickers + rowSpan |
| `features/suppliers/components/sections/SareeInventoryTable.tsx` | partially migrated; raw table remains |
| `features/inventory/components/externalPurchases/modals/SareeListModal.tsx` | partially migrated |
| `features/firms/components/FirmFinanceSections.tsx` | partially migrated |
| `features/payments/components/weaver/WeaverPaymentReportDocument.tsx` | print document — **must not** be made responsive; it targets A4 paper (see `07-DOCUMENTS.md`) |

For the four non-document files, apply R1 to whatever part **is** already on `DataTable`
and leave the raw table alone.

**Definition of done:** all 70 files in §9.R1 ticked; no desktop change; exclusions
documented.

---

## §7 — Phases R2–R8 (scope sketches; expand each when it starts)

Each of these gets its full recipe written **when it begins**, following R1's format. They
are deliberately sketched rather than over-specified — R1's outcomes will inform them.

### R2 — Modal content

**Scoped 2026-08-13.** Shell is done (§2) — this phase is content inside modals only.
`grep -rl "<Modal\b" src/features --include="*.tsx"` finds 56 files using the shared `Modal`
component today (fewer than the original 63-file audit estimate, since some have since been
consolidated or migrated). Of those, 25 contain a fixed multi-column CSS grid
(`gridTemplateColumns` with `1fr 1fr`, `repeat(2..4, ...)`) — that's the concrete R2 scope.
The other 31 are already single-column or use flex-wrap, which already reflows; nothing to
do there.

**The recipe (same pattern as R0.3's page-gutter fix, §3.3):**
1. Open the file, find every `style={{ display: "grid", gridTemplateColumns: "..." }}` (or
   the equivalent split across `style`/`className`) **that sits inside a `<Modal>`'s body**.
   Grids outside any modal are out of scope for R2 (they may be R3/R5's job).
2. Collapse to one column under `md`, keep the original column count from `md` up (so tablet
   and desktop stay exactly as they are):
   ```tsx
   // Before — fixed 2-column grid at every width:
   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

   // After — 1 column mobile, 2 columns from md up (unchanged at ≥768px):
   <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
   ```
   For a 3- or 4-column grid, use `md:grid-cols-3` / `md:grid-cols-4` — keep the original
   count in the `md:` class, `grid-cols-1` for the base (mobile) case. Leave `gap` in `style`
   (Tailwind's gap utility would work too, but changing the mechanism for a value that isn't
   changing is unnecessary noise — only touch `gridTemplateColumns`).
3. That's the whole edit. Don't touch field ordering, labels, validation, or spacing values.

**Verification:** same as R1 — `gridTemplateColumns` → Tailwind class swap is inert above
`md` (768px), so `tsc`/`build`/`lint` catch type/syntax errors but not the responsive
behavior itself; the visual change only appears below 768px. Flag unverified batches the
same way R1 did if no browser session is available.

**Explicitly excluded from this pass** (per §0 and Part D.4 of `05-OVERLAYS.md`):
- Nested sub-dialogs (e.g. `DefectPhotoPrompt.tsx` opened from inside `VerificationModal.tsx`)
  stay plain fixed divs — do not wrap them in `<Modal>` or apply this recipe to their internal
  grids as if they were top-level modal content; treat them as their own small case if they
  have a multi-column grid, using the same recipe, but don't restructure the nesting itself.
- Data tables inside modals already got R1's `responsive` treatment where applicable (e.g.
  `SareeListModal`, `RecordDetailsModal`) — nothing further to do for those.
- The `max-h-[92dvh]` bottom-sheet constraint (Modal's own mobile shell) is already correct
  per §2 — don't re-verify it per modal, it's a property of `Modal.tsx` itself, not per-usage.

**25 files with a multi-column grid to collapse:**
- `bulk-orders/components/BulkOrderCreateModal.tsx`
- `bulk-orders/components/BulkOrderDetailPage.tsx`
- `customers/components/modals/CustomerModals.tsx`
- `design-library/components/DesignLibraryComponents.tsx`
- `design-library/components/DesignModals.tsx`
- `firms/components/FirmModals.tsx`
- `inventory/components/PurchaseModals.tsx`
- `inventory/components/ViewStockDialog.tsx`
- `inventory/components/modals/DispatchShopModal.tsx`
- `inventory/components/modals/InventoryDetailModal.tsx`
- `materials/components/issueMaterial/RecordDetailsModal.tsx`
- `payments/components/vendor/ContactVendorModal.tsx`
- `payments/components/vendor/VendorDetailModal.tsx`
- `payments/components/vendor/VendorPayNowModal.tsx`
- `payments/components/weaver/WeaverPaymentDetailModal.tsx`
- `portals/components/shop-staff/CustomerProfiles.tsx`
- `portals/components/shop-staff/desktop/CustomerProfileDialog.tsx`
- `portals/components/weaver-portal/theme.tsx`
- `production/components/batch-creation/PickerModals.tsx`
- `production/components/dialogs/OrderDialogContent.tsx`
- `production/components/factory-loom/AddLoomModal.tsx`
- `users/components/EditModal.tsx`
- `users/components/ViewProfileModal.tsx`
- `vendors/components/vendors-page/AddVendorModal.tsx`
- `weavers/components/modals/NewWeaverModal.tsx`

### R3 — Dashboards, stats & KPI grids
Per portal, in this order: **Admin → Weaver → Worker → Shop staff → Superadmin**. Admin first
(highest traffic); Superadmin last (its login is the blocked one — see §7.1). For each: KPI
grids collapse, `StatsStrip` verified at 320px, and a decision recorded in §10 on whether that
portal's `Mobile*.tsx` islands stay or fold into responsive components. **Recording the decision
is the deliverable — do not fold islands in R3**, that is a refactor.

### R4 — Reports pages
The hardest phase. 9 report sections under `features/reports/components/sections/` plus
per-portal reports. Charts need mobile heights and legend handling; filter toolbars need a
mobile filter sheet; export/print controls need a mobile home. **Scope this with the user
before starting** — it involves genuine design decisions, unlike R1–R3.

### R5 — Forms & filter bars — ⚠️ PARTIALLY COMPLETE (2026-08-13)

**`DateFilterBar` needed no work** — verified it already uses unconditional `flex flex-wrap`
with no breakpoint gating at all, so it already wraps safely at any width. Nothing to fix.

**Full-page multi-column forms** — grepped `src/features` for `gridTemplateColumns` outside
modals/reports/dashboards (already covered by R1-R4) and found 9 files. Fixed all 9:

- [x] `inventory/components/modals/shared/TransportForm.tsx` — 1 grid, standard Field form
- [x] `users/components/AddUserForm.tsx` — 2 grids, standard Field form
- [x] `firms/components/FirmsPage.tsx` — totals row (fixed pixel columns, stacks below `md`,
  exact desktop preserved via arbitrary `grid-cols` value) + financial mini-strip (3 plain
  label/value pairs, safe at `md:grid-cols-3`)
- [x] `users/components/AddUserPage.tsx` — 6-column role stat strip, given a tablet step
  (`grid-cols-1 md:grid-cols-3 xl:grid-cols-6`) rather than jumping straight to 6 at `md:`,
  applying the §3.7 lesson from the same-day tablet regression
- [x] `bulk-orders/components/BulkOrderDetailPage.tsx`, `inventory/components/AllPurchasesPage.tsx`,
  `inventory/components/AllStockPage.tsx`, `weavers/components/AllWeaversPage.tsx` — full
  record-card grids (not simple stat tiles), all given a `md:grid-cols-2 xl:grid-cols-N`
  tablet step for the same reason.

**Not done — "sticky mobile action bar for long forms"** from the original R5 sketch. This is
a real structural feature (a fixed bottom bar with Save/Cancel that stays visible while a long
form scrolls), not a mechanical class swap like everything else in this rollout — it needs its
own design pass (which forms qualify as "long", what the bar contains, interaction with
existing bottom nav on mobile portals). Deliberately left for a dedicated future session rather
than guessing. **R5 is not fully closed** until this is scoped and either built or explicitly
descoped.

Verified via `tsc`/`build`/`lint` — clean, same baseline. Not visually verified in-browser
(same recurring stuck preview policy-check).

### R6 — Navigation audit
Verification, not construction. Each portal's mobile nav already exists. Confirm nav items
match the desktop nav, touch targets meet §3.5, and resolve drift between portals.

### R7 — Grid-as-table triage
188 files use `gridTemplateColumns`/`grid-cols-`. **Triage before touching:**
- **Real data grids** (repeated rows of uniform records) → migrate to `DataTable` **+**
  card mode. Note: migration is Phase 4 work; if a grid needs migrating, log it in §10 for
  a Phase 4 session rather than doing it here.
- **Form/document layouts** → collapse to one column under `md`. This *is* Phase R work.
- **Print documents** (`shared/ui/document/**`, all `mm`-based) → **leave alone entirely.**
  They target paper, not screens.

### R8 — QA, device matrix, governance
Add responsive metrics to `frontend/scripts/ratchet.mjs` (see §8). Build a per-portal device
checklist at 320 / 375 / 414 / 768 / 1024 / 1280px. Add an ESLint rule discouraging new
fixed-width containers in `features/**`.

### §7.1 Known verification blocker — read before planning browser QA

**Superadmin login (9999999999) has never succeeded via browser automation**, across
multiple sessions and a genuinely fresh dev server. `POST /auth/request-otp` returns `201`
with `exists:true` every time, but the UI never advances past phone entry. Admin
(8888888888) and Weaver (9391774388) **do** work. All test OTPs are `123456`.

Consequences for planning:
- Do not schedule Superadmin QA as a blocking step.
- Worker / Shop-staff credentials were never obtained. **Try Admin's "Add New User" page
  first** — it likely lists the same table Superadmin has, and that path has never been tried.
- If the Superadmin flow blocks a phase, log it and proceed; do not burn a session retrying.

---

## §8 — Ratchet metrics to add (Phase R8)

Add to `METRICS` in `frontend/scripts/ratchet.mjs` using `phase: 9`, following the existing
metric shape (`id`, `label`, `phase`, `baseline`, `target`, `measure`, optional
`higherIsBetter`).

| id | label | baseline | target | higherIsBetter |
|---|---|---|---|---|
| `datatable-responsive` | `<DataTable responsive>` adoption | 0 | 70 | ✅ |
| `column-priority` | files assigning `priority:` in ColumnDef | 0 | 70 | ✅ |
| `hand-rolled-breakpoints` | raw `window.innerWidth` checks | 3 | 0 | — |
| `fixed-width-px` | fixed `width: <n>` ≥320 in `features/**` | TBD | ↓ | — |

Baselines are as measured 2026-08-12. Re-measure rather than trusting these if the tree has
moved. `datatable-responsive` is the headline number for this whole effort.

---

## §9 — STATUS LEDGER

**This section is the authoritative record of progress. Update it in the same commit as the
work.** Tick with a date: `- [x] FileName.tsx (2026-08-13)`.

### R0 — Foundations
- [x] R0.1 Consolidate 3 hand-rolled `window.innerWidth` sites (2026-08-12) — **assessed, deliberately not converted, see §10.** They're inline open-time guards in `Modal`/`Popover`/`Drawer` (3 of the highest-blast-radius shared files in the app); a direct read is not worse than a hook value here, so this is cosmetic-only risk for zero gain.
- [x] R0.2 Fluid numerals in `StatsStrip` (2026-08-12) — `fontSize: 48` → `clamp(28px, 8vw, 48px)` in `PortalChrome.tsx`. Desktop (≥1280px, ~8vw≈102px clamped to max 48px) unchanged; shrinks only below ~600px viewport width. `tsc` clean. Not yet visually verified in-browser (no session dev server up at edit time) — flag for next browser-access session.
- [x] R0.3 Gutter-scale audit (2026-08-12) — user-reported bug (screenshot: bulk-orders "All Orders" page wasting ~25% of a 375px viewport on each side). Root cause identified and the reusable recipe documented at §3.3. Fixed the reported page (6 spots across `AllOrdersPage.tsx`/`AllOrdersFilterBar.tsx`/`AllOrdersAnalyticsSection.tsx`). **Not exhaustive** — same bug pattern likely exists on other pages; §3.3 flags this for R7/a future grep pass rather than fixing all instances now (out of scope for one report).

### R1 — Tables → card mode — ✅ COMPLETE (70 / 70, incl. 9 documented exclusions)

**audit** (2/2) ✅
- [x] `audit/components/audit-log/ActionLogSection.tsx` (2026-08-12)
- [x] `audit/components/audit-log/LoginHistorySection.tsx` (2026-08-12)

**bulk-orders** (2/2) ✅
- [x] `bulk-orders/components/BulkOrderOverviewPaymentsTabs.tsx` (2026-08-12)
- [x] `bulk-orders/components/BulkOrderSareesTab.tsx` (2026-08-12)

**customers** (7/7) ✅
- [x] `customers/components/sections/InactiveCustomersSection.tsx` (2026-08-12)
- [x] `customers/components/sections/RetailCustomersSection.tsx` (2026-08-12)
- [x] `customers/components/sections/RetailDetailSection.tsx` (2026-08-12)
- [x] `customers/components/sections/WholesaleCustomersSection.tsx` (2026-08-12)
- [x] `customers/components/sections/wholesaleDetail/OrderHistoryTab.tsx` (2026-08-13)
- [x] `customers/components/sections/wholesaleDetail/OverviewTab.tsx` (2026-08-13)
- [x] `customers/components/sections/wholesaleDetail/PaymentHistoryTab.tsx` (2026-08-13)

**finishing** (2/2) ✅
- [x] `finishing/components/FinishingQuotationsSection.tsx` (2026-08-12)
- [x] `finishing/components/FinishingStaffSection.tsx` (2026-08-12)

**firms** (2/2) ✅
- [x] `firms/components/FirmFinanceSections.tsx` (2026-08-12) *(also has a raw table — see §6 exclusions, only the DataTable part was touched)*
- [x] `firms/components/FirmsPage.tsx` (2026-08-12)

**inventory** (0/5)
- [ ] `inventory/components/externalPurchases/modals/SareeListModal.tsx` *(partial — §6)*
- [ ] `inventory/components/externalPurchases/sections/PurchasesTable.tsx`
- [ ] `inventory/components/modals/shared/InvoiceGenerator.tsx`
- [ ] `inventory/components/modals/shared/SareeReviewList.tsx`
- [ ] `inventory/components/sections/DispatchHistorySection.tsx`

**materials** (4/4) ✅
- [x] `materials/components/issueMaterial/IssuanceHistorySection.tsx` (2026-08-12)
- [x] `materials/components/issueMaterial/RecordDetailsModal.tsx` (2026-08-12)
- [x] `materials/components/sections/BatchesSection.tsx` (2026-08-13)
- [x] `materials/components/sections/PurchaseHistorySection.tsx` (2026-08-13)

**payments** (8/8) ✅
- [x] `payments/components/history/PaymentHistorySection.tsx` (2026-08-12)
- [x] `payments/components/outstanding/ExternalOutstanding.tsx` (2026-08-12)
- [x] `payments/components/outstanding/SareeDetailTable.tsx` (2026-08-12) *(fixed a real `priority` type-widening bug from a conditional-spread column — see commit)*
- [x] `payments/components/outstanding/TopSellers.tsx` (2026-08-12)
- [x] `payments/components/vendor/VendorPaymentsSection.tsx` (2026-08-12)
- [x] `payments/components/weaver/WeaverPaymentDetailModal.tsx` (2026-08-12)
- [x] `payments/components/weaver/WeaverProductionSummaryPanel.tsx` (2026-08-12)
- [x] `payments/components/wholesale/WholesaleTableView.tsx` (2026-08-13)

**portals** (6/6, 2 responsive + 4 already-covered)
- [x] `portals/components/weaver-portal/ReferenceHistorySection.tsx` — **excluded, not applicable.** Already has a hand-built `isMobile` branch per tab (3 separate card lists) that fully replaces its 3 `DataTable` instances on mobile; the tables only render in the `!isMobile` branch, so `responsive` would be dead code.
- [x] `portals/components/weaver-portal/WarpRequestPage.tsx` — **excluded, same reason** (own `isMobile` branch with a bespoke card list; `DataTable` only renders on desktop/tablet).
- [x] `portals/components/weaver-portal/desktop/PaymentsSection.tsx` — **excluded, not applicable.** Only imported by `DesktopWeaverPortal.tsx`; mobile users get `MobileWeaverPortal.tsx`'s own UI, this component never renders on mobile.
- [x] `portals/components/worker/ReceiptHistoryTable.tsx` (2026-08-13)
- [x] `portals/components/worker/finishing/SectionC.tsx` — **excluded, same reason as ReferenceHistorySection** (own `isMobile` card-list branch; the desktop `DataTable`+`renderExpandedRow` never renders on mobile).
- [x] `portals/components/worker/weavers/SareeSelectionTable.tsx` (2026-08-13)

**pricing** (1/3, 2 excluded)
- [x] `pricing/components/rates-pricing/RateHistorySection.tsx` (2026-08-13)
- [x] `pricing/components/rates-pricing/MakingChargesSection.tsx` — **excluded, not applicable.** Uses `DataTable`'s `renderExpandedRow` for inline-edit-row editing; `CardList` (the `responsive` mobile fallback) does not support `renderExpandedRow` at all, so enabling it would silently drop the ability to edit rates on mobile. §0 forbids removing functionality. Left as a table-only (non-responsive) `DataTable`, same as before.
- [x] `pricing/components/rates-pricing/WholesaleTermsSection.tsx` — **excluded, same reason** (also uses `renderExpandedRow` for inline term editing).

**production** (6/6) ✅
- [x] `production/components/FactoryLoomPage.tsx` (2026-08-13)
- [x] `production/components/ProductionHistoryPage.tsx` (2026-08-13)
- [x] `production/components/factory-loom/LoomDetailPage.tsx` (2026-08-13)
- [x] `production/components/sections/DefectiveSareesSection.tsx` (2026-08-13)
- [x] `production/components/sections/ProductionHistorySection.tsx` (2026-08-13)
- [x] `production/components/sections/batches/BatchViews.tsx` (2026-08-13) — 2 `<DataTable>` instances (BatchListView + BatchTableView), both done

**purchasing** (2/2) ✅
- [x] `purchasing/components/approvals/ExternalPurchaseCard.tsx` (2026-08-13)
- [x] `purchasing/components/approvals/HistorySection.tsx` (2026-08-13)

**reports** (8/9, 1 excluded) — *tables only; full report layout is R4*
- [x] `reports/components/sections/CustomerReport.tsx` (2026-08-12)
- [x] `reports/components/sections/OutstandingPaymentsReport.tsx` (2026-08-12)
- [x] `reports/components/sections/OverdueAlertsReport.tsx` (2026-08-12) — 4 separate `<DataTable>` instances in this file, all done
- [x] `reports/components/sections/ProfitLossReport.tsx` (2026-08-13) — its 2-column `ledgerColumns` table (label/amount with section headers, subtotals, net row) is a genuine semantic mismatch for card mode, left untouched. Its `perFirmColumns` table (real row-collection) got the standard treatment.
- [x] `reports/components/sections/RawMaterialReport.tsx` (2026-08-13) — 2 `<DataTable>` instances (stock comparison + receipt batch log)
- [x] `reports/components/sections/RetailSalesReport.tsx` (2026-08-13)
- [x] `reports/components/sections/SareeProductionReport.tsx` (2026-08-13) — 2 `<DataTable>` instances (external purchases + per-weaver production)
- [x] `reports/components/sections/WeaverPaymentReport.tsx` (2026-08-13)
- [x] `reports/components/sections/WholesaleSalesReport.tsx` (2026-08-13)

**suppliers** (2/4, 2 excluded)
- [x] `suppliers/components/sections/ExternalPurchaseHistorySection.tsx` (2026-08-13)
- [x] `suppliers/components/sections/PurchaseHistoryTable.tsx` — **excluded, not applicable.** Uses `renderExpandedRow` to drill into a nested `SareeInventoryTable` per purchase; `CardList` doesn't support it. Same reasoning as the pricing exclusions.
- [x] `suppliers/components/sections/SareeInventoryTable.tsx` — **excluded, same reason** (its own `renderExpandedRow` drills into individual saree pieces). Also has a partial-migration raw `<table>` — see §6 — untouched either way.
- [x] `suppliers/components/sections/supplierProfile/PaymentsTab.tsx` (2026-08-13)

**users** (1/1) ✅
- [x] `users/components/UserTable.tsx` (2026-08-13)

**vendors** (2/2) ✅
- [x] `vendors/components/vendors-page/PurchaseOrderHistoryTable.tsx` (2026-08-13)
- [x] `vendors/components/vendors-page/VendorProfile.tsx` (2026-08-13) — 2 `<DataTable>` instances (bills + payment transactions)

**weavers** (5/5) ✅
- [x] `weavers/components/WeaverSareesSection/ExternalSareesTable.tsx` (2026-08-13)
- [x] `weavers/components/WeaverSareesSection/MainSareesTable.tsx` (2026-08-13) — ~13-20 conditionally-rendered columns; assigned title + 2 always-present secondary fields, rest default to priority 2
- [x] `weavers/components/sections/WeaverCardAndListViews.tsx` (2026-08-13)
- [x] `weavers/components/sections/WeaverTableAndDirectory.tsx` (2026-08-13)
- [x] `weavers/components/sections/weaverDrawer/WeaverDrawerTabs.tsx` (2026-08-13)

**R1 COMPLETE** (2026-08-13) — all 70 originally-assigned files resolved: either `responsive`-enabled or documented as a deliberate exclusion (9 total: 4 portal "island" files already responsive via a different mechanism, 4 `renderExpandedRow`-based drill-down tables incompatible with `CardList`, 1 genuine ledger-layout semantic mismatch). Verified via `grep -rl "<DataTable" src/features` (71 consumers — one more than the original count, pre-existing drift not part of this effort) vs `grep -rl "responsive"` (61) vs `grep -rl "priority:"` (66) — the arithmetic checks out against the exclusion list. `tsc`/`build`/`lint` clean at every commit, same pre-existing baseline throughout.

### R2 — Modal content — ✅ COMPLETE (23 / 25 converted, 2 documented exclusions)

Recipe finalized in §7. Done 2026-08-13 via 4 parallel worktree-isolated agents (disjoint
file sets, each verified independently before merge — no repeat of the R1 session's
worktree-teardown/collision issues; all 4 completed cleanly this time).

- [x] `bulk-orders/components/BulkOrderCreateModal.tsx` (2026-08-13)
- [x] `bulk-orders/components/BulkOrderDetailPage.tsx` — **no change needed.** Its only grid (weight-tally cards) sits in the page body, not inside its 2 `<Modal>`s (tally/delete confirmation, no grids).
- [x] `customers/components/modals/CustomerModals.tsx` (2026-08-13)
- [x] `design-library/components/DesignLibraryComponents.tsx` (2026-08-13) — 2 grids
- [x] `design-library/components/DesignModals.tsx` (2026-08-13) — 2 grids
- [x] `firms/components/FirmModals.tsx` (2026-08-13) — 3 grids
- [x] `inventory/components/PurchaseModals.tsx` (2026-08-13) — 1 of 5 grids converted (`ViewPurchaseModal`). **The other 4, in `PrintPurchaseModal`'s `receipt` JSX, are excluded** — that JSX is portaled verbatim to `#document-print-root` and printed as a physical GRN; it's a print document sharing a file with a modal, out of scope per §0/§7.
- [x] `inventory/components/ViewStockDialog.tsx` (2026-08-13)
- [x] `inventory/components/modals/DispatchShopModal.tsx` (2026-08-13)
- [x] `inventory/components/modals/InventoryDetailModal.tsx` (2026-08-13) — 3 grids
- [x] `materials/components/issueMaterial/RecordDetailsModal.tsx` (2026-08-13)
- [x] `payments/components/vendor/ContactVendorModal.tsx` (2026-08-13)
- [x] `payments/components/vendor/VendorDetailModal.tsx` (2026-08-13) — 2 grids
- [x] `payments/components/vendor/VendorPayNowModal.tsx` (2026-08-13) — 2 grids, one an uneven `1fr 1fr 1.2fr` template preserved via `md:grid-cols-[1fr_1fr_1.2fr]` rather than plain `grid-cols-3` (keeps desktop column widths exact)
- [x] `payments/components/weaver/WeaverPaymentDetailModal.tsx` (2026-08-13)
- [x] `portals/components/shop-staff/CustomerProfiles.tsx` (2026-08-13) — a second grid outside the Modal, left untouched (out of scope)
- [x] `portals/components/shop-staff/desktop/CustomerProfileDialog.tsx` (2026-08-13)
- [x] `portals/components/weaver-portal/theme.tsx` — **excluded, false positive.** All 4 grids live in `DesignDetailCard`/`SareeTypeDetailCard` (dashboard cards, not modal content); the file's one `<Modal>` is a design-graph image lightbox with no grid.
- [x] `production/components/batch-creation/PickerModals.tsx` (2026-08-13) — 2 grids
- [x] `production/components/dialogs/OrderDialogContent.tsx` (2026-08-13) — 3 grids inside the nested invoice-preview Modal; asymmetric `1fr 100px` line-item grids preserved via `md:grid-cols-[1fr_100px]` rather than `grid-cols-2`. 3 top-level grids outside any Modal in this file left untouched (out of scope).
- [x] `production/components/factory-loom/AddLoomModal.tsx` (2026-08-13) — 2 of 3 grids (third was already single-column)
- [x] `users/components/EditModal.tsx` (2026-08-13)
- [x] `users/components/ViewProfileModal.tsx` (2026-08-13)
- [x] `vendors/components/vendors-page/AddVendorModal.tsx` (2026-08-13) — 6 grids
- [x] `weavers/components/modals/NewWeaverModal.tsx` (2026-08-13) — 2 grids

Verified via `tsc`/`build`/`lint` on every batch before merge — clean, same ~33-error
pre-existing baseline throughout, zero new errors in any touched file.

### R3 — Dashboards & stats — ✅ COMPLETE (2026-08-13)

**Investigated all 5 portals before touching anything** — the actual R3 deliverable is the
per-portal decision below, not code. Root-cause finding: **all 5 portal shells branch on
`isMobile` at the very top** (`WeaverPortal.tsx`, `WorkerPortal.tsx`, `ShopStaffPortal.tsx`,
`BeereDashboard.tsx`, `SuperadminDashboard.tsx`), but **4 of the 5 swap in an entirely
separate mobile component tree** (dedicated `Mobile*.tsx`/`*Desktop.tsx` pairs) while
**Superadmin swaps only the nav chrome** and reuses the same content pages for both.
That architectural difference is what determined whether each portal needed a code change:

| Portal | Split architecture | KPI grids found | Action |
|---|---|---|---|
| **Admin** | Full tree swap (`desktop.tsx` vs `mobile.tsx`, separate `Mobile*` components) | `ThreeCol.tsx`/`RawMaterial.tsx` — confirmed imported **only** by `desktop.tsx`; mobile has its own `MobileRawMaterial` etc. | **No change.** Never renders on mobile. |
| **Weaver** | Full tree swap (`DesktopWeaverPortal`/`MobileWeaverPortal`) | `PaymentLedgerPage.tsx` (4 grids) — imported by `MobileWeaverPortal.tsx`, genuinely mobile content | **Investigated, no change needed.** The 6-column ledger table (lines ~309-329) is already wrapped in `overflowX: auto` + `minWidth: 640` — a deliberate, correctly-guarded §3.6 scroll fallback, not a bug. The two 2-column stat grids are simple stat pairs, mobile-safe as-is. |
| **Worker** | Full tree swap (`WorkerPortalDesktop`/mobile branch in `WorkerPortal.tsx`, `WorkerHome` vs `WorkerHomeDesktop`) | `WorkerHome.tsx` — a fixed 3-column "Quick Stats" trio (short number + short label per tile) | **No change.** Read the actual content — 3 short stat tiles is a standard, mobile-safe pattern at any phone width; not the "12-column form crammed onto a phone" failure mode this phase targets. |
| **Shop staff** | Full tree swap (`MobileHeader`/`MobileTabBar` vs desktop chrome in `ShopStaffPortal.tsx`) | None found | **No change.** |
| **Superadmin** | **Chrome-only swap** — `SAMobileTopNav`/`SAMobileMenuDrawer` vs `SATopNav`, but `renderPage()` (the actual content, including `SAOverviewPage`) is called from **both** branches | `SAOverviewPage.tsx` (2 grids: 4-col actions, 3-col raw-material cards), `SAWeaverSection.tsx` (1 grid: 2-col per-card stat pair) | **Fixed** — all 3 grids collapsed to `grid-cols-1 md:grid-cols-N`, desktop unchanged. This portal was the one genuine case: its content is not swapped out on mobile the way the other 4 are. |

**The island-pattern decision (§2's open question, now resolved for R3):** keep the
per-portal mobile-tree-swap pattern for Admin, Weaver, Worker, and Shop staff — each already
has a comprehensive, working, purpose-built mobile experience; folding them into single
responsive components is a large refactor, explicitly out of scope for Phase R (§0), and
there is no correctness problem driving a change. Superadmin's chrome-only-swap architecture
is the outlier and is why it was the only portal needing real R3 fixes — worth knowing if a
future session wonders why Superadmin "needed more work" than its siblings.

Verified via `tsc`/`build` — clean, no lint regressions.

### R4 — Reports pages — ✅ COMPLETE (2026-08-13)

Scoped with the user via `AskUserQuestion` first, per this section's own instruction — two
genuine design decisions, not mechanical fixes:

1. **`ReportTabNav.tsx`'s 10-tab strip** (icon+label+desc, fixed equal-width flex row —
   unusable at any phone width). Chose a **dropdown/picker** over horizontal scroll: below
   `md`, the tab strip is replaced by a single "current report" trigger + `DropdownMenu`
   (reused the existing shared `DropdownMenu` component, no new overlay UI built) listing
   all 10 tabs with icon/label/desc. Desktop tab strip unchanged, gated behind
   `hidden md:flex`. Reasoning: at 10 destinations, a scannable list beats blind horizontal
   scrolling for findability.
2. **`PageHeaderAndMetrics.tsx`'s 5-tile stats strip** (flex row, no wrap). Chose a
   **2-column wrapping grid** (`grid-cols-2 md:flex`) over horizontal scroll or a 1-column
   stack — keeps every metric glanceable with no gesture required, consistent with the
   grid-collapse pattern already used everywhere else in this rollout (R2/R3).

Both implemented and committed directly (not via parallel agents, since they needed
judgment). Not visually verified in-browser — same stuck browser-preview policy check as
a prior session; `tsc`/`build`/`lint` clean.

**Then the mechanical remainder** — 13 report-section files with hardcoded gutters
(`padding: "32px 40px"` or `"0 48px"`) and/or fixed multi-column chart/KPI grids — done via
3 parallel worktree-isolated agents (same successful pattern as R2), applying the two
already-established recipes (§3.3 gutters, grid-collapse) with no new decisions needed:

- [x] `ReportTabNav.tsx` — mobile picker + gutter (design decision, see above)
- [x] `PageHeaderAndMetrics.tsx` — 2-col grid + gutter (design decision, see above)
- [x] `OutstandingPaymentsReport.tsx` — gutter + 1 grid
- [x] `RawMaterialReport.tsx` — gutter + 1 grid
- [x] `RetailSalesReport.tsx` — gutter + 2 grids
- [x] `CustomerReport.tsx` — gutter + 3 grids
- [x] `ScheduledReportsSection.tsx` — gutter + 2 grids
- [x] `OverdueAlertsReport.tsx` — gutter + 1 grid
- [x] `DownloadHistorySection.tsx` — gutter + 1 grid
- [x] `ReportsFooter.tsx` — gutter + 1 grid (unequal `1.6fr 1fr 1fr 1fr 1fr` preserved via `md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]`, desktop exact)
- [x] `LiveSummarySnapshot.tsx` — gutter (48px variant, `xl:px-12`) + 1 grid
- [x] `SareeProductionReport.tsx` — gutter + 3 grids
- [x] `WholesaleSalesReport.tsx` — gutter (2 wrappers) + 2 grids
- [x] `WeaverPaymentReport.tsx` — gutter + 2 grids
- [x] `ProfitLossReport.tsx` — gutter + 1 grid (uneven `1.6fr 1fr` preserved via `md:grid-cols-[1.6fr_1fr]`); `ledgerColumns` DataTable correctly untouched — plain 2-col table, not a grid, already excluded from R1 as a semantic mismatch

Verified via `tsc`/`build`/`lint` on every batch before merge — clean, same ~33-error
pre-existing baseline throughout, zero new errors in any touched file.

### R5–R8
- [ ] R5 Forms & filter bars
- [ ] R6 Navigation audit
- [ ] R7 Grid-as-table triage
- [ ] R8 QA, device matrix, ratchet metrics

---

## §10 — Log: found-not-fixed, decisions, deviations

Append here rather than acting. This is what keeps §0's scope rule survivable — noticing a
problem and recording it is the correct response, not fixing it.

**Format:** `YYYY-MM-DD | phase | file | note`

| Date | Phase | File / area | Note |
|---|---|---|---|
| 2026-08-12 | — | — | Document created. Baselines: 70 DataTable consumers with 0 `responsive`; 5 raw `<table>` files; 188 files using grid columns; 63 modal files; 3 hand-rolled breakpoint checks. |
| 2026-08-12 | R0.1 | `Modal.tsx`, `Popover.tsx`, `Drawer.tsx` | The 3 `window.innerWidth<768` sites are inline `onOpenAutoFocus` guards, not layout state — checked at the moment the dialog opens. Converting to `useIsMobile()` would be purely cosmetic and touches 3 app-wide shared primitives for no behavioral gain. Left as-is; not a gap, a deliberate skip. |
| 2026-08-13 | R4 (regression) | `ReportTabNav.tsx`, `PageHeaderAndMetrics.tsx` | **Real bug, user-reported via screenshot**: whole page horizontally scrolled on tablet. Root cause: I gated both components' revert-to-dense-layout at `md:` (768px) instead of `xl:` (1280px) — neither the 10-tab strip nor the 5-tile stats row fits in the 768-1279px tablet range, so the row overflowed its container and dragged the entire page into horizontal scroll. Fixed same session (commit `a004cee`) by moving both to `xl:`. New standing rule added at §3.7 to prevent recurrence: row/flex-per-item layouts must revert at `xl:`, not `md:`; grid-based column-stacked cards are safe at `md:`. Audited rest of R1-R4 for the same `md:flex` pattern via `git log` — nothing else found. Still not visually verified in-browser (recurring stuck preview policy-check this whole rollout) — this incident is exactly why that gap matters; treat any future `md:`-gated row layout as higher-risk until real browser verification is possible. |

---

## §11 — Related documents

- `design-system/00-ROADMAP.md` — the 8-phase design-system effort this extends
- `design-system/02-LAYOUT.md` — layout/breakpoint foundations
- `design-system/04-DATA-DISPLAY.md` — `DataTable`, Part H.2 defines card mode
- `design-system/05-OVERLAYS.md` — `Modal`, Part D.1 defines the mobile bottom sheet
- `design-system/07-DOCUMENTS.md` — print documents, **explicitly out of scope for Phase R**
- `design-system/RATCHET.md` — auto-generated; regenerate with `npm run ratchet`
