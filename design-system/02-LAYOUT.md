# BK LOOM DESIGN SYSTEM
# Phase 2 — Layout & Page Architecture

**Scope:** App shell, navigation architecture, page template contract, grid, density, responsive strategy, scroll & sticky behaviour.
**Depends on:** Phase 1 (spacing, breakpoint, layout tokens).
**Blocks:** Phases 3–7.

---

# PART A — THE AUDIT

## A.1 Nine nav-height constants, and they disagree

`shared/ui/section-navigator-data.ts`:
```ts
export const MAIN_NAV_H             = 90;
export const SUB_NAV_H              = 66;
export const SECTION_NAV_H          = 56;
export const MOBILE_NAV_H           = 60;
export const WORKER_MOBILE_HEADER_H = 56;
export const WORKER_TOPNAV_H        = 72;
export const WORKER_SECTION_NAV_H   = 52;
export const SHOP_MOBILE_HEADER_H   = 56;
export const SHOP_SECTION_NAV_H     = 52;
```

Nine constants for what is structurally **three** regions (top bar, sub bar, section strip) across three portals.

### 🐛 A real bug this creates

```ts
// shared/ui/section-navigator-data.ts:16
export const SUB_NAV_H = 66;

// features/dashboards/components/beere-dashboard/components/TopNav.tsx:15
const SUB_NAV_H = 60;              // ← local shadow, different value
// …
// TopNav.tsx:349
height: SUB_NAV_H,                 // renders at 60
```

But the scroll machinery computes offsets from the **exported** value:
```ts
// SectionNavigator.tsx:131-132
? (isMobileOrTablet ? MOBILE_NAV_H : MAIN_NAV_H + SUB_NAV_H)          // 90 + 66 = 156
: (… MAIN_NAV_H + SUB_NAV_H + SECTION_NAV_H)                          // 90 + 66 + 56 = 212

// section-navigator-data.ts:104
scroll-margin-top: ${MAIN_NAV_H + SUB_NAV_H + 16}px;                  // 172
```

**The admin dashboard's sub-nav renders at 60px but every scroll offset is calculated at 66px.** Every "scroll to section" on the admin dashboard lands **6px off** and slides content under the sticky bar. `SATopNav.tsx:301` uses the imported `66`, so superadmin is correct and admin is not — the same feature behaves differently per role.

This is exactly the class of bug that a single source of truth eliminates.

## A.2 Four competing breakpoint systems

| Source | Breakpoints | Mechanism |
|---|---|---|
| `hooks/useResponsive.ts` | 768 / 1280 | JS `window.innerWidth` + resize listener |
| `hooks/useResponsive.ts` → `useIsMobile` | 768 | second listener, same file |
| `app/components/ui/use-mobile.ts` | own constant | shadcn `matchMedia` |
| `TopNav.tsx:36` | **1320** (`compact`) | inline `w < 1320` |
| `styles/mobile.css` | 768 | CSS media query |
| one component | **900** | inline literal |

Measured literals in the codebase: `768` ×4, `900` ×1, `1280` ×1, `1320` ×2.

**Consequences:**
- The nav collapses at 1320 while the page gutter changes at 1280 → a 40px band where the nav is compact but the page is still at desktop padding.
- `useResponsive` fires `setState` on **every resize pixel** with no debounce and no `matchMedia`, re-rendering the entire tree during a drag-resize.
- SSR/first-paint default is `1280`, so mobile users get one desktop frame before hydration corrects it.

## A.3 `mobile.css` — 80 lines of attribute-substring hacks

```css
@media (max-width: 768px) {
  div[style*="padding: 0px 56px"],
  div[style*="padding: 24px 56px"],
  div[style*="padding: 32px 56px"],
  /* …13 more variants… */ {
    padding: 16px !important;
  }

  div[style*="grid-template-columns"],
  div[style*="gridTemplateColumns"] {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
  }

  table {
    display: block !important;
    overflow-x: auto !important;
    white-space: nowrap !important;
  }
}
```

**Why this is the single most dangerous file in the frontend:**

1. **It matches on serialised inline-style strings.** Change `padding: 32px 56px` to `padding: 32px 48px` anywhere and that element silently stops being responsive. There is no error, no test, no type check — it just breaks.
2. **It collapses *every* grid to a single column.** A deliberate `1fr 100px` action row, a 12-column dashboard, and a 2-column form all become the same vertical stack. There is no way to opt out.
3. **`table { display: block }` destroys table semantics** on mobile. Screen readers lose row/column association; `<thead>` stops being announced as headers. This is a WCAG 1.3.1 failure.
4. **`white-space: nowrap !important`** forces horizontal scroll on every table regardless of content.
5. **Every rule is `!important`**, so no component can override it.

## A.4 Hand-computed viewport math, drifting

```js
height:    "calc(100vh - 90px - 100px)"   // Hero.tsx:10
height:    "calc(100vh - 90px - 160px)"   // SAOverviewPage.tsx:15   ← different
minHeight: "calc(100vh - 90px)"           // AllStockPage, AllPurchasesPage,
                                          //   NotificationsPage, AllWeaversPage
minHeight: "calc(100vh - 64px)"           // weaver-portal NotificationsPage,
                                          //   BatchHistoryPage
maxHeight: "calc(100vh - 360px)"          // DesignLibraryPage:233
```

Five different subtrahends. None reference `MAIN_NAV_H`. All will be wrong the moment the nav height changes. And `100vh` on iOS Safari includes the collapsing URL bar — these all overflow on mobile Safari.

## A.5 Token sprawl in layout properties

| Property | Distinct values in `features/` |
|---|---|
| `padding` | **474** |
| `borderRadius` | **27** (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 40, 52, 99, 999) |
| `gap` | **25** (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48) |

Most-used paddings: `"14px 16px"` ×115, `"10px 14px"` ×103, `"10px 12px"` ×90, `"12px 16px"` ×85, `"12px 14px"` ×74. **Not one of these is on a 4pt grid** except `"12px 16px"` and `"8px 16px"`.

## A.6 Grids are hardcoded and non-responsive

```
"1fr 1fr"                              ×138
"1fr 1fr 1fr"                          ×40
"repeat(3, 1fr)"                       ×22
"repeat(4,1fr)"                        ×12     ← inconsistent spacing from the above
"2fr 1fr"                              ×12
"1fr 100px"                            ×7
"2fr 130px 130px 150px 80px 36px"      ×3
"repeat(auto-fit, minmax(420px, 1fr))" ×2      ← the only genuinely responsive ones
```

**138 hardcoded two-column grids** with no breakpoint handling — which is precisely why `mobile.css` had to bulldoze all grids to flex-column with `!important`. The hack exists because the grids are not responsive; fix the grids and the hack becomes unnecessary.

## A.7 No page template

`CustomersPage.tsx` — the composition root — holds **25+ `useState` calls** before rendering anything, then composes `PageHeader`, `StatsStrip`, and six sections with no shared shell. Every feature invents its own header, stat strip, toolbar and spacing. `PageHeaderAndStats.tsx` exists **three separate times** in three features with three different implementations.

## A.8 Layout-related Laws-of-UX violations

| Law | Violation |
|---|---|
| **Miller's Law (7±2)** | Nav exposes ~20 destinations. Groups are unbalanced: `people` 6, `materials` 4, `production` 4, `finance` 3, `operations` 3, `overview` 1. |
| **Hick's Law** | Group hover-menus open on `mouseenter` with a 140ms close timer — decision cost plus accidental dismissal. |
| **Law of Proximity** | Card padding 24/32/36/48 and gaps 2–48 mean grouping strength is arbitrary, not semantic. |
| **Law of Common Region** | Sections have no consistent container, so where one section ends and the next begins is ambiguous. |
| **Fitts's Law** | `padding: "5px 11px"` @ 11px ≈ 22px tall controls; nav pills in a horizontally-scrolling strip. |
| **Law of Uniform Connectedness** | 474 padding values means visually-related elements don't share a spatial signature. |
| **Serial Position Effect** | The most-used destination (`Overview`) is first — correct — but the second-most-used (`Payments`) is buried in a hover menu. |
| **Jakob's Law** | Hero section occupies `calc(100vh - 190px)` on the Overview page — a full viewport of decoration before any operational data. Nobody's ERP does this. |

---

# PART B — LAYOUT PRINCIPLES

| # | Principle | Mechanism |
|---|---|---|
| **L1** | **One source of truth for every dimension.** | All chrome heights come from Phase 1 layout tokens. Zero literals. |
| **L2** | **Layout is composed, never bulldozed.** | `mobile.css` deleted. Components declare their own responsive behaviour. |
| **L3** | **Mobile-first, container-aware.** | Base styles are mobile; breakpoints add. Cards use container queries, not viewport queries. |
| **L4** | **Content is never taller than it needs to be.** | `100dvh`, not `100vh`. `min-height`, not `height`. |
| **L5** | **Every page is the same shape.** | One `PageShell` contract. Features fill slots, they don't invent structure. |
| **L6** | **Density is a mode, not a redesign.** | One `data-density` attribute switches row heights and paddings system-wide. |
| **L7** | **Structure before decoration.** | Operational data is above the fold. Hero imagery is a band, not a screen. |
| **L8** | **Scroll containers are explicit and singular.** | One scroll owner per region. No nested scroll traps. |

---

# PART C — THE APP SHELL

## C.1 Region model

```
┌──────────────────────────────────────────────────────────────┐
│  SKIP LINK (visually hidden until focused)                   │
├──────────────────────────────────────────────────────────────┤
│  TOPBAR            72px    sticky, z-nav (200)               │  ← brand, search, notifications, profile
├──────────────────────────────────────────────────────────────┤
│  GROUPBAR          52px    sticky, z-nav (200)               │  ← 6 primary groups (was SUB_NAV)
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PAGE                                                  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  SECTIONBAR   48px   sticky @ 124, z-sticky(100) │  │  │  ← in-page anchors, optional
│  │  ├──────────────────────────────────────────────────┤  │  │
│  │  │  PAGE HEADER     — title, breadcrumb, actions    │  │  │
│  │  ├──────────────────────────────────────────────────┤  │  │
│  │  │  STAT BAR        — 2–6 metric cards (optional)   │  │  │
│  │  ├──────────────────────────────────────────────────┤  │  │
│  │  │  TOOLBAR         — search, filters, view toggle  │  │  │
│  │  ├──────────────────────────────────────────────────┤  │  │
│  │  │  CONTENT         — sections on the 12-col grid   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  FOOTER            64px    static                            │
└──────────────────────────────────────────────────────────────┘
```

## C.2 Canonical heights — replacing all nine constants

```
--shell-topbar-h          72px    desktop / tablet
--shell-topbar-h-mobile   56px
--shell-groupbar-h        52px    desktop / tablet
--shell-groupbar-h-mobile  0      (collapses into the drawer)
--shell-sectionbar-h      48px
--shell-footer-h          64px
--shell-mobilenav-h       64px    bottom tab bar (mobile only)
```

**Derived — never hand-computed:**
```css
--shell-chrome-h:        calc(var(--shell-topbar-h) + var(--shell-groupbar-h));    /* 124px */
--shell-chrome-h-full:   calc(var(--shell-chrome-h) + var(--shell-sectionbar-h));  /* 172px */
--shell-content-min-h:   calc(100dvh - var(--shell-chrome-h) - var(--shell-footer-h));
--shell-sticky-offset:   var(--shell-chrome-h);
--scroll-margin-anchor:  calc(var(--shell-chrome-h-full) + var(--space-4));        /* 188px */
```

### Migration map — old constant → new token
| Old | Value | New | Value | Note |
|---|---|---|---|---|
| `MAIN_NAV_H` | 90 | `--shell-topbar-h` | **72** | 90px is 25% taller than needed; 72 recovers 18px of viewport on every page |
| `SUB_NAV_H` (exported) | 66 | `--shell-groupbar-h` | **52** | ← the bug: this said 66 |
| `SUB_NAV_H` (TopNav local) | 60 | `--shell-groupbar-h` | **52** | ← while this said 60 |
| `SECTION_NAV_H` | 56 | `--shell-sectionbar-h` | **48** | |
| `MOBILE_NAV_H` | 60 | `--shell-mobilenav-h` | **64** | raised to clear the 44px target + safe area |
| `WORKER_TOPNAV_H` | 72 | `--shell-topbar-h` | 72 | already correct — becomes the canonical value |
| `WORKER_MOBILE_HEADER_H` | 56 | `--shell-topbar-h-mobile` | 56 | |
| `WORKER_SECTION_NAV_H` | 52 | `--shell-sectionbar-h` | 48 | |
| `SHOP_MOBILE_HEADER_H` | 56 | `--shell-topbar-h-mobile` | 56 | |
| `SHOP_SECTION_NAV_H` | 52 | `--shell-sectionbar-h` | 48 | |

**Nine constants → four.** Worker and shop portals stop having their own geometry.

## C.3 Shell CSS contract

```css
.bk-shell {
  min-height: 100dvh;                 /* dvh, not vh — iOS URL bar */
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  grid-template-areas: "topbar" "groupbar" "main" "footer";
  background: var(--surface-canvas);
}

.bk-shell__topbar {
  grid-area: topbar;
  position: sticky; top: 0;
  height: var(--shell-topbar-h);
  z-index: var(--z-nav);
  background: var(--surface-brand);
  border-bottom: 1px solid rgba(200,155,71,0.14);
}

.bk-shell__groupbar {
  grid-area: groupbar;
  position: sticky; top: var(--shell-topbar-h);   /* derived, never a literal */
  height: var(--shell-groupbar-h);
  z-index: var(--z-nav);
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border-default);
}

.bk-shell__main {
  grid-area: main;
  min-height: var(--shell-content-min-h);
  padding-inline: var(--gutter-page-x);
  padding-block: var(--gutter-page-y);
}

.bk-shell__footer {
  grid-area: footer;
  min-height: var(--shell-footer-h);
}

/* Every anchorable section, once, globally.
   Replaces the injected SECTION_NAV_GLOBAL_STYLE string. */
[data-section] { scroll-margin-top: var(--scroll-margin-anchor); }

/* Mobile: groupbar collapses into the drawer; bottom tab bar appears */
@media (max-width: 767px) {
  .bk-shell {
    --shell-topbar-h: var(--shell-topbar-h-mobile);
    --shell-groupbar-h: 0px;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: "topbar" "main" "footer";
    padding-bottom: calc(var(--shell-mobilenav-h) + env(safe-area-inset-bottom));
  }
  .bk-shell__groupbar { display: none; }
}
```

**Every viewport calculation in the app now derives from four tokens.** Change `--shell-topbar-h` once and every sticky offset, scroll margin and min-height follows.

## C.4 Skip link (currently missing — WCAG 2.4.1)

```html
<a href="#main" class="bk-skip-link">Skip to main content</a>
```
```css
.bk-skip-link {
  position: absolute; left: var(--space-4); top: calc(var(--space-4) * -10);
  z-index: var(--z-tooltip);
  padding: var(--space-3) var(--space-5);
  background: var(--surface-raised); color: var(--text-brand);
  border: 2px solid var(--border-focus); border-radius: var(--radius-md);
  transition: top var(--duration-fast) var(--ease-standard);
}
.bk-skip-link:focus { top: var(--space-4); }
```
Without this, keyboard users tab through ~30 nav controls on every page load.

---

# PART D — NAVIGATION ARCHITECTURE

## D.1 The information-architecture problem

Current: 6 groups, 20 destinations, unbalanced (6 / 4 / 4 / 3 / 3 / 1), all reached through hover menus.

```
overview   (1)  Overview
production (4)  Production, Batches, Designs, Finishing
materials  (4)  Materials, Receive Stock, Issue Material, External Purchases
finance    (3)  Payments, Firms, Reports
people     (6)  Weavers, Customers, Vendors, Suppliers, Factory Looms, Add New User
operations (3)  Inventory, Rates & Pricing, Notifications
```

Two problems:
- **`people` mixes entities with an action.** "Add New User" is a *task*, not a destination. It belongs in a global action, not the nav.
- **`operations` is a leftover bucket.** Inventory belongs with Materials; Notifications is global chrome; Rates is finance.

## D.2 Restructured IA — 5 groups, 3–4 each

```
Overview      —  standalone home                                          (1)

Production    —  Production · Batches · Designs · Finishing               (4)

Inventory     —  Materials · Stock · Receive · Issue · Purchases          (5 → 4 visible,
                                                                              "Purchases" nests
                                                                              under Receive)

Finance       —  Payments · Reports · Firms · Rates & Pricing             (4)

Partners      —  Weavers · Customers · Suppliers · Vendors                (4)
```

**Moved out of the nav entirely:**
- `Add New User` → a global **+ New** action menu in the topbar (it's a task)
- `Factory Looms` → a tab inside **Production** (it's a sub-view, not a destination)
- `Notifications` → the bell icon in the topbar (it's already there — the nav entry is a duplicate)

**Result: 20 destinations → 17, in 5 groups of 1/4/4/4/4.** Every group is inside Miller's 7±2, and the group sizes are uniform so the menus are predictable.

## D.3 Nav interaction rules

| Rule | Spec | Why |
|---|---|---|
| Group menus open on **click**, not hover | `aria-expanded`, Escape closes, focus trapped | Hover menus with a 140ms close timer are the #1 source of accidental dismissal; also unusable on touch |
| Active group persists on drill-down | keep the existing `NAV_GROUP_FALLBACK` map | Already correct — preserve it |
| Groupbar **never scrolls horizontally** on desktop | 5 groups fit at 1024px | Horizontal-scrolling nav hides destinations (currently required at `compact`) |
| Every nav target ≥ 44×44 | `min-height: var(--target-min)` | Fitts's Law / WCAG 2.5.8 |
| Current page has `aria-current="page"` | plus a 2px bottom indicator, not colour alone | WCAG 1.4.1 |
| Keyboard: `←/→` moves between groups, `↓` opens | roving tabindex | WAI-ARIA menubar pattern |

## D.4 Mobile navigation

Bottom tab bar with the **5 groups**, plus a drawer for everything else:

```css
.bk-mobilenav {
  position: fixed; inset-inline: 0; bottom: 0;
  height: calc(var(--shell-mobilenav-h) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  z-index: var(--z-nav);
  display: grid; grid-template-columns: repeat(5, 1fr);
  background: var(--surface-raised);
  border-top: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
}
.bk-mobilenav__item { min-height: var(--target-min); }
```
`env(safe-area-inset-bottom)` is currently absent everywhere — the nav sits under the iPhone home indicator.

---

# PART E — THE PAGE TEMPLATE CONTRACT

## E.1 The contract

Every page is exactly this shape. Features fill slots; they never invent structure.

```tsx
<PageShell>
  <PageShell.SectionBar sections={…} />        {/* optional — in-page anchors   */}
  <PageShell.Header                            {/* required                      */}
    breadcrumb={…}
    title="Customers"
    subtitle="Wholesale and retail accounts"
    actions={<Button>Add Customer</Button>}
  />
  <PageShell.Stats>                            {/* optional — 2–6 metric cards   */}
    <MetricCard … />
  </PageShell.Stats>
  <PageShell.Toolbar                           {/* optional — search / filters   */}
    search={…} filters={…} view={…}
  />
  <PageShell.Content>                          {/* required                      */}
    <Section id="wholesale" title="Wholesale">…</Section>
    <Section id="retail"    title="Retail">…</Section>
  </PageShell.Content>
</PageShell>
```

## E.2 Slot specifications

### `PageShell.Header`
```
grid:     [breadcrumb] / [title  ·  actions] / [subtitle]
height:   auto, min 88px
padding:  0 0 var(--space-6)
border:   bottom 1px var(--border-subtle)
title:    title-lg  (24px Fraunces 600)      — Phase 1 token
subtitle: body-md   (14px Inter 400)  --text-secondary
actions:  right-aligned, gap var(--space-2), primary action last
```

**Mobile (<768):** actions move below the title, full-width; subtitle truncates to 2 lines.

### `PageShell.Stats`
```
grid:  repeat(auto-fit, minmax(200px, 1fr))
gap:   var(--gap-card)          /* 24 */
margin: var(--space-6) 0
max:   6 cards — beyond that it's a section, not a stat bar
```
`auto-fit` + `minmax` means it reflows **without a single media query** — 6→4→3→2→1 columns naturally. This is the pattern that replaces all 138 hardcoded `"1fr 1fr"` grids.

### `PageShell.Toolbar`
```
layout:   flex, wrap, gap var(--space-3)
height:   min 48px
order:    [search grows] [filters] [divider] [view toggle] [export]
sticky:   optional — top: var(--shell-chrome-h), z-index: var(--z-sticky)
```
**Mobile:** search full-width on row 1; filters collapse into a single "Filters (3)" button opening a sheet.

### `PageShell.Content`
```
display:        flex column
gap:            var(--gap-section)      /* 40 */
max-width:      var(--container-max)    /* 1600 */
margin-inline:  auto
```

### `Section`
```
id:             required — drives SectionBar anchors + scroll-margin
scroll-margin:  var(--scroll-margin-anchor)   [data-section]
header:         title-md (20px) + optional description + optional action
gap:            var(--space-4) between header and body
```

## E.3 What this replaces

| Today | After |
|---|---|
| `PageHeaderAndStats.tsx` in customers, materials, reports — 3 implementations | 1 `PageShell.Header` + `PageShell.Stats` |
| Each page hand-rolling `minHeight: "calc(100vh - 90px)"` | `PageShell` owns it |
| Each page hand-rolling `background: T.silkCream` | `--surface-canvas` on the shell |
| Each page choosing its own gutter | `--gutter-page-x` on the shell |
| Ad-hoc `scrollIntoView` + `setTimeout(…, 100)` in `CustomersPage:36` | `[data-section]` + native `scroll-margin-top` |

---

# PART F — THE GRID SYSTEM

## F.1 12-column grid

```css
.bk-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 12), minmax(0, 1fr));
  gap: var(--gap-card);
}
```
`minmax(0, 1fr)` — not `1fr` — otherwise long unbreakable content (invoice numbers, URLs) blows out the column. This is the cause of several of the horizontal-overflow bugs that `html { overflow-x: hidden }` is currently masking.

| Breakpoint | Columns | Gutter | Gap |
|---|---|---|---|
| xs (0) | 4 | 16 | 16 |
| sm (480) | 4 | 20 | 16 |
| md (768) | 8 | 24 | 20 |
| lg (1024) | 12 | 32 | 24 |
| xl (1280) | 12 | 48 | 24 |
| 2xl (1536) | 12 | 48 + centred @ 1600 max | 24 |

## F.2 Standard layout recipes

Replace the 138 `"1fr 1fr"` instances with these named recipes. Each is responsive by construction — **no media queries, no `mobile.css`.**

| Recipe | CSS | Use |
|---|---|---|
| `.bk-layout-cards` | `repeat(auto-fit, minmax(280px, 1fr))` | card grids, weaver lists |
| `.bk-layout-stats` | `repeat(auto-fit, minmax(200px, 1fr))` | metric strips |
| `.bk-layout-wide` | `repeat(auto-fit, minmax(420px, 1fr))` | chart pairs |
| `.bk-layout-split` | `minmax(0,2fr) minmax(0,1fr)` → 1col < md | content + sidebar |
| `.bk-layout-form` | `repeat(auto-fit, minmax(240px, 1fr))` | form field pairs |
| `.bk-layout-detail` | `minmax(0,1fr) minmax(320px, 380px)` → stack < lg | detail + rail |

```css
/* the only two that need a query */
.bk-layout-split  { display:grid; gap:var(--gap-card); grid-template-columns:1fr; }
@media (min-width:768px){ .bk-layout-split{ grid-template-columns:minmax(0,2fr) minmax(0,1fr);} }

.bk-layout-detail { display:grid; gap:var(--gap-card); grid-template-columns:1fr; }
@media (min-width:1024px){ .bk-layout-detail{ grid-template-columns:minmax(0,1fr) minmax(320px,380px);} }
```

## F.3 Container queries for cards

A metric card inside a 380px sidebar should lay out like a mobile card even on a 1920px screen. Viewport queries cannot express that; container queries can.

```css
.bk-card { container-type: inline-size; container-name: card; }

@container card (max-width: 280px) {
  .bk-card__value { font-size: var(--text-metric-md); }   /* 30 → 24 */
  .bk-card__delta { display: block; margin-top: var(--space-1); }
}
```
Supported in all current browsers. This is what makes the same card component correct in a stat bar, a sidebar, and a modal.

---

# PART G — SPACING RHYTHM & CONTAINMENT

## G.1 The vertical rhythm ladder

Five levels, and only five. This is the fix for 474 padding values.

```
Page gutter        --gutter-page-x     48 / 32 / 24 / 20 / 16
Between sections   --gap-section       40
Between cards      --gap-card          24
Inside a card      --pad-card          24
Inside a stack     --gap-stack         12
Icon ↔ label       --gap-inline        8
```

**Law of Proximity made mechanical:** gap between two things must be *smaller* than the gap to the next group. `8 < 12 < 24 < 40`. Every ratio is ≥1.5×, which is the threshold at which grouping reads unambiguously.

## G.2 Padding decision table

| Element | Padding |
|---|---|
| Card (default) | `var(--pad-card)` = 24 |
| Card (compact / in sidebar) | `var(--pad-card-compact)` = 20 |
| Card header | `24 24 16` |
| Card footer | `16 24 24` |
| Table cell | `var(--pad-cell-y) var(--pad-cell-x)` = `12 16` |
| Table header cell | `0 16`, height `44` |
| Button md | `10 16` |
| Button sm | `6 12` |
| Input md | `10 12` |
| Badge | `2 8` |
| Modal body | `24` |
| Toolbar | `12 0` |

**Top 5 current values and their replacements:**
| Current | Count | → Token |
|---|---|---|
| `"14px 16px"` | 115 | `12px 16px` — cell padding |
| `"10px 14px"` | 103 | `10px 16px` — input md |
| `"10px 12px"` | 90 | `10px 12px` ✅ already valid |
| `"12px 16px"` | 85 | ✅ already valid |
| `"12px 14px"` | 74 | `12px 16px` |

Snapping to grid changes nothing perceptible (±2px) and eliminates 470 of 474 values.

## G.3 Radius reconciliation

27 values → 8 tokens.

| Current values | → Token |
|---|---|
| 1, 2, 3, 4, 5 | `--radius-xs` (4) |
| 6, 7 | `--radius-sm` (6) |
| 8, 9, 10 | `--radius-md` (8) |
| 11, 12, 13, 14, 15 | `--radius-lg` (12) |
| 16, 18 | `--radius-xl` (16) |
| 20, 22 | `--radius-2xl` (20) |
| 24, 26, 28, 30 | `--radius-3xl` (28) |
| 40, 52, 99, 999, `50%` | `--radius-full` |

---

# PART H — DENSITY MODES

Silk ERP operators scan hundreds of rows. One layout cannot serve both a manager glancing at KPIs and a clerk reconciling 400 invoices.

```html
<div class="bk-shell" data-density="default">
```

```css
[data-density="comfortable"] {
  --row-h: var(--row-height-comfortable);   /* 56 */
  --pad-cell-y: var(--space-4);             /* 16 */
  --pad-card: var(--space-8);               /* 32 */
  --gap-card: var(--space-8);               /* 32 */
  --table-font: var(--text-body-md);        /* 14 */
}
[data-density="default"] {
  --row-h: var(--row-height-default);       /* 48 */
  --pad-cell-y: var(--space-3);             /* 12 */
  --pad-card: var(--space-6);               /* 24 */
  --gap-card: var(--space-6);               /* 24 */
  --table-font: var(--text-body-md);        /* 14 */
}
[data-density="compact"] {
  --row-h: var(--row-height-compact);       /* 40 */
  --pad-cell-y: var(--space-2);             /* 8  */
  --pad-card: var(--space-5);               /* 20 */
  --gap-card: var(--space-4);               /* 16 */
  --table-font: var(--text-body-sm);        /* 13 — never below 12 */
}
```

**Rules:**
- Density affects **spacing and row height only** — never colour, never contrast, never below the 12px floor.
- Touch targets stay ≥44px in every mode: compact rows get 40px visual height with 2px of invisible padding either side.
- Persisted per-user in `localStorage`; default `default`.
- Density is scoped — a page can set `data-density="compact"` on one table without affecting the shell.

---

# PART I — RESPONSIVE STRATEGY

## I.1 Kill `mobile.css`

**Delete the file.** Every one of its 80 lines is replaced by a component-level rule:

| `mobile.css` hack | Replacement |
|---|---|
| 15 `div[style*="padding: …56px"]` selectors | `--gutter-page-x` on `.bk-shell__main`, responsive by token |
| `div[style*="grid-template-columns"] → flex column` | `auto-fit`/`minmax` recipes (F.2) — reflow without queries |
| `height: 140/148/160px → auto` | `min-height` + `auto`, never fixed heights on headers |
| hide `position:absolute; right:0; width:46%` | `PageShell.Header` art is a `::after` hidden below `md` |
| `flex: 0 0 62% → 100%` | `.bk-layout-split` |
| `table { display:block; nowrap }` | `.bk-table-scroll { overflow-x:auto }` **wrapper** — table keeps its semantics |
| `div[style*="width: 260…320px"] → 100%` | `.bk-layout-detail` rail stacks below `lg` |
| `gap: 48/32 → 16` | `--gap-card` / `--gap-section` are already responsive tokens |

## I.2 Unify the breakpoint system

**One hook. `matchMedia`, not resize listeners.**

```ts
// hooks/useBreakpoint.ts — replaces useResponsive, useIsMobile, use-mobile
const QUERIES = {
  sm: '(min-width: 480px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;
```

- Uses `matchMedia` + `addEventListener('change')` — fires on **threshold crossings only**, not every pixel. Removes the full-tree re-render during resize.
- `useSyncExternalStore` for a correct first paint with no hydration flash.
- The `1320` `compact` literal in `TopNav.tsx:36` is deleted — with 5 nav groups instead of 6, the bar fits at `lg` (1024).
- The `900` literal is snapped to `md`.

**Prefer CSS over JS.** Every layout decision in Part F is pure CSS. `useBreakpoint` is only for behaviour that CSS genuinely cannot express — swapping a modal for a bottom sheet, or a table for a card list.

## I.3 Per-region responsive behaviour

| Region | xs (0–479) | sm (480–767) | md (768–1023) | lg (1024–1279) | xl+ (1280+) |
|---|---|---|---|---|---|
| **Topbar** | 56px, logo + search icon + bell | same | 72px, + wordmark | full | full |
| **Groupbar** | hidden → bottom tabs | hidden → bottom tabs | horizontal, icons+label | full | full |
| **Sectionbar** | horizontal scroll, snap | horizontal scroll | full | full | full |
| **Page header** | title, actions stacked full-width | same | title + actions inline | full | full |
| **Stats** | 1 col | 2 col | 3 col | 4–6 col | 4–6 col |
| **Toolbar** | search full-width, "Filters (n)" sheet | same | search + filter chips | full | full |
| **Tables** | **card list** | card list | scroll container | full | full + sticky first col |
| **Detail rail** | stacked below | stacked below | stacked below | side rail 320px | side rail 380px |
| **Modals** | full-screen sheet | full-screen sheet | centred, 560px | centred | centred |
| **Charts** | 1 col, 200px tall | 1 col, 240px | 2 col, 280px | 2 col, 320px | 2–3 col, 320px |

## I.4 Tables on mobile — the correct pattern

`table { display: block; white-space: nowrap }` is a WCAG 1.3.1 failure. Two legitimate patterns instead:

**Pattern A — Scroll container** (default; preserves semantics)
```css
.bk-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.bk-table-scroll table { min-width: max-content; }         /* table stays a table */
.bk-table-scroll th:first-child,
.bk-table-scroll td:first-child {
  position: sticky; left: 0; z-index: var(--z-raised);
  background: inherit;
  box-shadow: 1px 0 0 var(--border-default);
}
```

**Pattern B — Card list** (below `md`, for tables with >5 columns)
Each row becomes a card: primary column as the card title, 2–3 key columns as label/value pairs, the rest behind "Details". Rendered from the **same column definitions** as the table, so there is one source of truth.

## I.5 Safe areas & viewport units

```css
/* Currently absent everywhere — content sits under the iPhone home indicator */
.bk-shell         { padding-bottom: env(safe-area-inset-bottom); }
.bk-shell__topbar { padding-top: env(safe-area-inset-top); }
.bk-mobilenav     { padding-bottom: env(safe-area-inset-bottom); }
```

**Replace every `100vh` with `100dvh`.** On iOS Safari `100vh` includes the collapsing URL bar, so all six `calc(100vh - …)` sites currently overflow by ~60px on first paint.

---

# PART J — SCROLL & STICKY ARCHITECTURE

## J.1 One scroll owner

Currently `SectionNavigator.tsx:11` walks the DOM at runtime looking for a scroll container:
```ts
function findScrollContainer(el) { /* climbs parents checking computed overflow */ }
```
This is a symptom: nobody knows which element scrolls. The shell fixes it by declaration — **the document scrolls.** Regions do not create scroll contexts except:
- `.bk-table-scroll` (horizontal only)
- Modal / drawer bodies (vertical, contained)
- Dropdown menus with >8 items (`max-height`, vertical)

Nothing else gets `overflow: auto`. This removes the runtime DOM walk entirely.

## J.2 Sticky ladder

```
topbar       top: 0                          z-nav      (200)
groupbar     top: var(--shell-topbar-h)      z-nav      (200)
sectionbar   top: var(--shell-chrome-h)      z-sticky   (100)
toolbar      top: var(--shell-chrome-h)      z-sticky   (100)   [opt-in]
table header top: var(--shell-chrome-h-full) z-sticky   (100)   [opt-in]
```
Every offset is derived. Nothing is a literal. Change the topbar height and everything below re-stacks correctly.

## J.3 Anchor scrolling

Replace `CustomersPage.tsx:36`'s `scrollIntoView` + `setTimeout(…, 100)` with:
```css
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
[data-section] { scroll-margin-top: var(--scroll-margin-anchor); }
```
Native, correct offset, respects reduced motion, no timers, and **fixes the 6px admin/superadmin discrepancy from A.1** because both derive from the same token.

## J.4 Remove the global overflow suppressor

```css
/* beere-dashboard/theme.tsx GLOBAL_STYLE — delete */
html, body { overflow-x: hidden; max-width: 100%; }
```
This masks real overflow bugs and breaks `scrollIntoView` on horizontally-positioned elements. The actual causes:
- Grids using `1fr` instead of `minmax(0, 1fr)` → fixed in F.1
- Nav strips wider than the viewport → fixed by 5 groups + `overflow-x: auto` on the strip *itself*
- Absolutely-positioned hero art at `width: 46%` with no `max-width` → fixed by `PageShell.Header`

Also delete `button { background-color: rgba(0,0,0,0) }` and `button:focus { outline: none }` from the same block — the latter is a WCAG 2.4.7 failure already fixed by Phase 1's `:focus-visible` rule.

---

# PART K — HERO & OVERVIEW RESTRUCTURE

## K.1 The problem

```js
// Hero.tsx:10
height: "calc(100vh - 90px - 100px)", minHeight: 500
```
The Overview hero occupies a **full viewport minus chrome**. An operator opening the dashboard sees a photograph and a tagline — zero operational data above the fold. This is the clearest Jakob's Law violation in the app: no ERP does this, and users have to scroll before they can work.

## K.2 The fix — band, not screen

| | Current | New |
|---|---|---|
| Height | `calc(100vh - 190px)`, min 500 | `clamp(200px, 26vh, 320px)` |
| Content | image + tagline | greeting + date + **3 critical alerts** + primary action |
| Below fold | metrics | **metrics now above the fold** |

```css
.bk-hero {
  min-height: clamp(200px, 26vh, 320px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 380px);
  align-items: center;
}
@media (max-width: 767px) {
  .bk-hero { grid-template-columns: 1fr; min-height: 160px; }
  .bk-hero__art { display: none; }
}
```

The brand still leads — it just doesn't cost the operator a scroll. `SAOverviewPage.tsx:15` uses the same component, which also resolves the `-100px` vs `-160px` divergence.

---

# PART L — FOOTER

Currently `Footer.tsx` exists only on the beere dashboard. It becomes a shell region.

```
┌──────────────────────────────────────────────────────────────┐
│  Beere Keshava & Brothers        Support · Docs · Shortcuts   │
│  © 2026 · v2.4.1                          Density: [⚌ ▤ ▦]   │
└──────────────────────────────────────────────────────────────┘
```
```
height:      var(--shell-footer-h)     /* 64 */
background:  var(--surface-canvas)
border-top:  1px var(--border-subtle)
type:        caption (12px) --text-tertiary
padding:     0 var(--gutter-page-x)
mobile:      hidden (bottom tab bar occupies that space)
```
Contents: brand line, version (for support triage), keyboard-shortcuts link, and the **density toggle** — the natural home for a global display preference.

---

# PART M — IMPLEMENTATION PLAN

Ordered so nothing breaks mid-flight.

### Step 1 — Add shell tokens *(additive, 10 min)*
Append the Part C.2 tokens to `tokens.css`. Nothing consumes them yet.

### Step 2 — Fix the `SUB_NAV_H` bug *(5 min, standalone win)*
```bash
rg -n "SUB_NAV_H" frontend/src
```
Delete `const SUB_NAV_H = 60;` from `TopNav.tsx:15`; import it from `SectionNavigator` like `SATopNav` does. Admin scroll offsets immediately match superadmin. **Ship this alone if you want a fast, verifiable fix.**

### Step 3 — Re-point the nine constants at the four tokens *(30 min)*
```ts
// shared/ui/section-navigator-data.ts — keep the names, change the source
export const MAIN_NAV_H  = 72;   // was 90
export const SUB_NAV_H   = 52;   // was 66
export const SECTION_NAV_H = 48; // was 56
export const MOBILE_NAV_H  = 64; // was 60
export const WORKER_TOPNAV_H        = MAIN_NAV_H;
export const WORKER_SECTION_NAV_H   = SECTION_NAV_H;
export const WORKER_MOBILE_HEADER_H = 56;
export const SHOP_SECTION_NAV_H     = SECTION_NAV_H;
export const SHOP_MOBILE_HEADER_H   = 56;
```
Names unchanged → **no call site breaks.** Every derived offset corrects itself. Recovers 18px of vertical viewport on every page.

### Step 4 — Build `PageShell` *(1 day)*
New component in `shared/ui/PageShell.tsx` implementing Part E. Migrate **one** page first — `AllStockPage.tsx` is the best candidate: simple, and it already has the `calc(100vh - 90px)` pattern to remove.

### Step 5 — Land the layout recipes *(2 hours)*
Add the Part F.2 classes to `tokens.css`. Then:
```bash
rg -c 'gridTemplateColumns: "1fr 1fr"' frontend/src   # 138 sites
```
Convert per feature, starting with stat strips (`auto-fit minmax(200px, 1fr)`) — highest ratio of impact to risk.

### Step 6 — Delete `mobile.css` *(after Step 5)*
**Do not delete before Step 5** — the grids must be responsive first, or mobile regresses. Remove the import from `index.css`, delete the file, then test at 375 / 768 / 1024 / 1440.

### Step 7 — Unify breakpoints *(3 hours)*
Add `hooks/useBreakpoint.ts`. Keep `useResponsive` as a thin deprecated wrapper so the ~40 call sites keep working, then migrate incrementally. Delete the `1320` and `900` literals.

### Step 8 — Remove the global escape hatches *(1 hour)*
From `beere-dashboard/theme.tsx`'s `GLOBAL_STYLE`, delete:
```css
html, body { overflow-x: hidden; max-width: 100%; }
button { background-color: rgba(0,0,0,0); }
button:focus { outline: none; }
```
Then find the real overflow with:
```js
[...document.querySelectorAll('*')].filter(e => e.scrollWidth > document.documentElement.clientWidth)
```

### Step 9 — `100vh` → `100dvh` + safe areas *(30 min)*
```bash
rg -n "100vh" frontend/src
```
Six sites. Replace with `100dvh` or, better, `var(--shell-content-min-h)`.

### Step 10 — Hero restructure & footer *(half day)*
Part K and Part L.

---

# PART N — DEFINITION OF DONE

- [ ] `SUB_NAV_H` has exactly **one** definition; admin and superadmin scroll offsets match
- [ ] `rg "MAIN_NAV_H|SUB_NAV_H"` shows values derived from shell tokens, not literals
- [ ] `rg "100vh" frontend/src` returns zero results
- [ ] `styles/mobile.css` deleted and unimported
- [ ] `rg "!important" frontend/src/styles` returns zero results
- [ ] Exactly one breakpoint hook; `1320` and `900` literals gone
- [ ] `html { overflow-x: hidden }` removed and no page scrolls horizontally at 375/768/1024/1440
- [ ] `button:focus { outline: none }` removed; tab order visible on every page
- [ ] Skip link present and focusable
- [ ] At least 3 pages migrated to `PageShell`
- [ ] `gridTemplateColumns: "1fr 1fr"` count reduced from 138 to <40
- [ ] Nav is 5 groups; every group ≤4 destinations
- [ ] `env(safe-area-inset-*)` applied to shell, topbar, mobile nav
- [ ] Overview shows metrics above the fold at 1280×800
- [ ] `npm run typecheck && npm run build` clean

---

# PART O — WHAT PHASE 2 DOES *NOT* DO

- ❌ Does not restyle buttons, inputs, cards — **Phase 3**
- ❌ Does not build the Table component or fix table headers beyond the scroll wrapper — **Phase 4**
- ❌ Does not build the nav components themselves, only their geometry and IA — **Phase 5**
- ❌ Does not touch entity codes, statuses or currency formatting — **Phase 6**
- ❌ Does not address print layout — **Phase 7**
- ❌ Does not run the 474-padding-value codemod — **Phase 8** (Phase 2 defines the target values)

---

## Summary of what Phase 2 eliminates

| Before | After |
|---|---|
| 9 nav-height constants, 2 conflicting | 4 tokens, 1 source |
| 4 breakpoint systems, 4 literals | 1 `matchMedia` hook, 6 tokens |
| 80 lines of `!important` substring hacks | 0 — deleted |
| 6 hand-written `calc(100vh - …)` | 1 derived token |
| 474 padding values | 5-level rhythm ladder |
| 27 radii | 8 tokens |
| 138 non-responsive grids | 6 responsive recipes |
| 3 `PageHeaderAndStats` implementations | 1 `PageShell` contract |
| 20 destinations, unbalanced 6/4/4/3/3/1 | 17 destinations, 5 groups of 1/4/4/4/4 |
| Full-viewport hero, metrics below fold | 26vh band, metrics above fold |
| No skip link, focus outline removed | WCAG 2.4.1 + 2.4.7 compliant |
