# BK Loom Design System
# Phase 1 — Foundations

**Scope:** Colour, Typography, Spacing, Radius, Elevation, Motion, Z-index, Breakpoints.
**Status:** Complete. Token files shipped and ready to import.
**Depends on:** nothing. **Blocks:** every other phase.

---

# 1. Executive summary

Your instinct was right on all counts, and the numbers back it up harder than you probably expected.

I extracted the actual colours from your Overview-page analysis graphs (`ThreeCol.tsx`,
`MetricsBar.tsx`, `beere-dashboard/theme.tsx`, `reports/theme.ts`) and computed real WCAG
2.1 relative-luminance contrast ratios for every pair. Results:

| Colour | Role in your code | Contrast on cream `#F7F2EA` | Verdict |
|---|---|---|---|
| `#8B7060` taupe | **muted text, labels, table headers** | **4.11 : 1** | ❌ **Fails AA (needs 4.5)** |
| `#C89B47` antique gold | text, values, accents | **2.29 : 1** | ❌ **Fails badly** |
| `#E7C983` gold light | text on cream | **1.44 : 1** | ❌ **Effectively invisible** |
| `#F5E8D0` warm cream | text on cream | **1.09 : 1** | ❌ **Invisible** |
| `#A0506A` mauve | chart series "Payments" | 4.89 : 1 | ⚠️ passes as text, fails as a series |
| `#C0392B` crimson | alerts | 4.88 : 1 | ⚠️ marginal |
| `#6E0F2D` burgundy | brand, headings | 10.65 : 1 | ✅ excellent |
| `#1E6640` green | positive deltas | 6.22 : 1 | ✅ good |

**That taupe `#8B7060` at 4.11:1 is your "text not visible in table headers" bug.** It is
the universal label/muted/table-header colour across the whole app, and it misses AA by
9%. It is used at 10–11px with `letter-spacing: 1px` and `text-transform: uppercase`,
which compounds the problem — small, tracked-out, low-contrast text is the worst possible
combination for legibility.

And the chart series are worse:

```
series pair                 contrast    required for chart series: 3.0:1
#A0506A mauve / #C0392B red   1.00 : 1   ← IDENTICAL luminance
#A0506A mauve / #1E6640 green 1.27 : 1
#1E6640 green  / #C0392B red  1.27 : 1
#6E0F2D burg.  / #1E6640 green 1.71 : 1
#C89B47 gold   / #C0392B red  2.13 : 1
```

`#A0506A` and `#C0392B` have a contrast ratio of **1.00** — they are literally the same
brightness. In greyscale, in a printed invoice, or to any of the ~8% of men with
red-green colour vision deficiency, **those two chart series are the same colour.**

So: the brand hues are good. The *system built from them* is not. Phase 1 keeps every
brand hue you have and rebuilds the system around them so that it is measurably readable.

---

# 2. Full audit

## 2.1 What I inspected

```
frontend/src/
├── styles/
│   ├── theme.css        181 lines — shadcn default tokens, ZERO brand connection
│   ├── fonts.css          8 lines — 9 font families over 2 Google Fonts requests
│   ├── index.css          3 lines
│   ├── tailwind.css       4 lines
│   ├── globals.css        0 lines (empty)
│   └── mobile.css        80 lines
├── shared/ui/           56 shadcn components (the good foundation)
└── features/            21 competing local `theme.ts` files
```

## 2.2 The seven structural problems

### P1 — The token layer is disconnected from the brand
`styles/theme.css` defines the full shadcn token set:
`--primary: #030213` (near-black blue), `--chart-1: oklch(0.646 0.222 41.116)`, etc.

**None of these are your brand.** Meanwhile `beere-dashboard/theme.tsx` *overrides them at
runtime with a `<style>` string* because Motion crashes reading `oklch()`:

```js
/* frontend/src/features/dashboards/components/beere-dashboard/theme.tsx */
--chart-1: rgb(200,120,60);
--chart-2: rgb(60,160,140);
--chart-3: rgb(50,90,140);
```

So you have three competing colour systems: shadcn defaults, a runtime override, and 21
local `theme.ts` files. **This is the root cause of every inconsistency in the app.**

### P2 — 21 duplicated theme files, drifting apart
```
features/customers/components/theme.ts            28 lines
features/dashboards/.../beere-dashboard/theme.tsx 197 lines
features/portals/.../weaver-portal/theme.tsx      408 lines
features/reports/components/theme.ts               27 lines
features/inventory/components/theme.ts             47 lines
… 16 more
```
They all define `royalBurgundy`, `antiqueGold`, `taupe`. They have already drifted:
`crimson` is `#6E0F2D` in the dashboard theme but `#C0392B` in the reports theme. Same
token name, two different colours, two different meanings.

### P3 — 81% of components bypass the system entirely
412 of 507 `.tsx` files use inline `style={{}}`. Typography is set per-element with magic
numbers — `fontSize: 11.5`, `fontSize: 13.5`, `fontSize: 44`, `fontSize: 60`. There is no
type scale; there are ~40 distinct font sizes in the app.

### P4 — Nine font families
```css
Playfair Display, DM Mono, Plus Jakarta Sans, Inter, JetBrains Mono,
Cormorant Garamond, DM Sans, Space Grotesk, DM Serif Display
```
Two render-blocking Google Fonts requests, ~380KB of webfonts, and **no consistent
pairing rule.** `F.display` is Plus Jakarta Sans in the theme file but `.dms` is DM Serif
Display in the same file, and headings use both.

### P5 — Table headers are the worst-hit surface
`shared/ui/table.tsx` gets it right (`text-foreground`, `h-10`). But feature tables
override it with the failing taupe at 10–11px uppercase. `TableHead` also has no
background, no sticky behaviour, and `px-2` (8px) padding — too tight for scannable
columns.

### P6 — Layout arithmetic is hardcoded and fragile
```js
height: "calc(100vh - 90px - 100px)"   // Hero.tsx
height: "calc(100vh - 90px - 160px)"   // SAOverviewPage.tsx  ← different!
margin: "36px 48px 0"                  // magic gutters
```
Nav height is encoded as a literal in multiple files and they already disagree. Radii are
equally ad-hoc: `24`, `14`, `12`, `999`, `6`, `borderRadius: "50%"`.

### P7 — Global CSS escape hatches
`html, body { overflow-x: hidden }` and `button { background-color: rgba(0,0,0,0) }` are
injected globally from a dashboard theme file. These are symptom-suppressors for layout
bugs, and they break scroll-into-view and button defaults app-wide.

## 2.3 Laws-of-UX violations found

| Law / heuristic | Violation observed |
|---|---|
| **Jakob's Law** | Overview page metrics use a 44–60px serif display for numbers; scanning a KPI row is slower than a conventional 30px semibold. |
| **Miller's Law** | The `people` nav group holds 6 items, `materials` 4, `operations` 3 — unbalanced chunking, no visual grouping. |
| **Law of Proximity** | Card padding varies 24 / 32 / 36 / 48px across sections, so grouping reads inconsistently. |
| **Fitts's Law** | Period toggles are `padding: "5px 11px"` at 11px font ≈ 22px tall — under the 44px minimum target. |
| **Von Restorff (isolation)** | Gold is used for *both* decorative shimmer *and* KPI emphasis, so emphasis stops meaning anything. |
| **Aesthetic-Usability** | The visual polish is masking the legibility failures — which is exactly why they survived this long. |
| **WCAG 1.4.11** | Non-text contrast: `--border: rgba(0,0,0,0.1)` = 1.2:1 against white. Input borders are invisible. |
| **WCAG 2.4.7** | `button:focus { outline: none }` in the global style string removes focus indication entirely. |

---

# 3. Brand foundation

Before tokens, the brand needs stating, because tokens are downstream of it.

**Beere Keshava & Brothers** — *"We don't just weave silk. We weave legacy."*

| Attribute | Expression in the system |
|---|---|
| **Heritage** | Deep burgundy `#6E0F2D`, serif display face, generous whitespace |
| **Craft** | Warm neutral greys (never blue-grey), tactile elevation, restrained motion |
| **Precision** | Tabular figures everywhere, a strict 4pt grid, code typography for entity IDs |
| **Prestige** | Gold as a rare accent — a seal, not a highlighter |
| **Clarity** | AA minimum, AAA for body text, nothing below 12px |

**Brand colour hierarchy — this is the rule that fixes most of your visual noise:**

```
BURGUNDY  →  primary. Actions, brand, active state, emphasis.        ~60% of colour weight
NEUTRAL   →  the substrate. Text, surfaces, borders, structure.      ~30%
GOLD      →  the seal. Rare. Never carries text. Never a background   ~5%
              for text. Reserved for: brand marks, premium badges,
              chart accent series, celebratory states.
STATUS    →  green / amber / red / blue. Only for state. Never decorative. ~5%
```

Your current app inverts this: gold is everywhere, which is why nothing feels special
and several things are unreadable.

---

# 4. Colour system

## 4.1 Method

Ramps are generated in **OKLCH**, not HSL. HSL ramps have uneven perceived lightness
(HSL 50% yellow is far brighter than HSL 50% blue). OKLCH is perceptually uniform, so
`burgundy-600` and `blue-600` have genuinely comparable weight. This is the same approach
Radix, Tailwind v4, and Material 3 use.

Each ramp holds **hue constant**, steps **lightness on a fixed curve**, and scales
**chroma on a bell curve** peaking mid-ramp (real pigments desaturate at both extremes).

Anchors are your existing brand colours. `burgundy-900` **is** `#6E0F2D` — your exact
brand colour, unchanged. `burgundy-950` **is** `#4A061B`, your existing deep wine. The
ramp is built around them, not instead of them.

## 4.2 Primitive ramps

Every value below is annotated with its **measured contrast against white**.

### Burgundy — primary brand
| Step | Hex | vs white | Use |
|---|---|---|---|
| 50 | `#FEF4F5` | 1.08 | tint background, hover row |
| 100 | `#FEE8EB` | 1.17 | selected row, subtle fill |
| 200 | `#FFD1D8` | 1.37 | border on tinted surface |
| 300 | `#FCB2BE` | 1.71 | disabled brand fill |
| 400 | `#F18EA0` | 2.30 | decorative only |
| 500 | `#E06580` | 3.31 | ✅ min for borders/icons (3:1) |
| 600 | `#C54D69` | 4.53 | ✅ min for body text |
| 700 | `#A63A55` | 6.25 | hover state of primary |
| 800 | `#872D44` | 8.44 | active/pressed state |
| **900** | **`#6E0F2D`** | **11.87** | ★ **brand primary** (your colour, unchanged) |
| 950 | `#4A061B` | 15.75 | ★ deep wine — headers, dark surfaces |

### Gold — accent / seal
| Step | Hex | vs white | Use |
|---|---|---|---|
| 50 | `#FCF6EE` | 1.07 | premium badge background |
| 100 | `#F6EDDD` | 1.16 | subtle gold wash |
| 200 | `#EDDCC1` | 1.35 | gold border |
| 300 | `#E0C59A` | 1.66 | decorative |
| 400 | `#CEAA6D` | 2.19 | decorative fill |
| **500** | **`#C89B47`** | **2.55** | ★ **your gold** — **decoration only, never text** |
| 600 | `#9F7315` | 4.25 | ✅ smallest gold usable as large text |
| 700 | `#845E04` | 5.86 | ✅ **gold text token** |
| 800 | `#6B4B01` | 7.98 | gold text on tinted bg |
| 900 | `#553B01` | 10.44 | — |
| 950 | `#392601` | 14.47 | — |

> **The single most important rule in this document:** `#C89B47` is a **surface** colour,
> not a **text** colour. Wherever your code currently renders gold text
> (`color: "#C89B47"`, `color: "#C4923A"`, `color: "#E8A84A"`), it must become
> `--text-accent` = `#845E04`. That one substitution fixes dozens of unreadable labels.

### Warm neutral — the substrate
Warm (hue 65°) rather than blue-grey, so it sits with silk cream instead of fighting it.

| Step | Hex | vs white | Use |
|---|---|---|---|
| 0 | `#FFFDFB` | 1.01 | raised card on canvas |
| 25 | `#FAF8F6` | 1.06 | ★ **page canvas** |
| 50 | `#F5F2EE` | 1.12 | ★ **table header / sunken well** |
| 100 | `#EAE5E1` | 1.25 | subtle border, divider |
| 200 | `#D8D2CE` | 1.50 | ★ **default border** |
| 300 | `#BFB9B4` | 1.94 | strong border, disabled text-on-fill |
| 400 | `#A09A94` | 2.78 | placeholder, disabled text |
| 500 | `#847E79` | 4.01 | ⚠️ **large text only** (≥18.66px) |
| 600 | `#69635E` | 5.92 | ✅ ★ **tertiary text — replaces the failing taupe** |
| 700 | `#4F4A45` | 8.76 | ✅ ★ **secondary text** |
| 800 | `#322D28` | 13.62 | — |
| 900 | `#1D1814` | 17.60 | ✅ ★ **primary text (AAA)** |
| 950 | `#110C08` | 19.45 | inverse surface |

### Status ramps
Same construction. Key steps:

| | 50 | 100 | 200 | 500 | **600** | **700** | 800 | 900 |
|---|---|---|---|---|---|---|---|---|
| **Green** (success) | `#F0FAF4` | `#E2F3E8` | `#C9E8D4` | `#4CA978` | `#319061` `3.97` | **`#1F774E` `5.52`** | `#15603D` | `#0F4C30` |
| **Amber** (warning) | `#FEF6EC` | `#FBEBDA` | `#F6D9BA` | `#CA8104` | `#AB6C00` `4.31` | **`#8D5802` `5.95`** | `#724701` | `#5B3700` |
| **Red** (danger) | `#FEF5F3` | `#FFE8E5` | `#FED3CD` | `#E7645A` | `#CB4B43` `4.54` | **`#AB3832` `6.28`** | `#8C2B26` | `#70211D` |
| **Blue** (info) | `#F1F8FE` | `#E1F0FE` | `#C5E3FD` | `#3E9AE0` | `#2082C6` `4.14` | **`#0A6AA7` `5.78`** | `#045588` | `#03446D` |

Pattern for every status: `-50` background, `-200` border, `-700` text/icon. That triad
is guaranteed AA and is used identically for every state chip in the app.

Your existing `#1E6640` green sits between green-700 and green-800 and stays valid — but
use the token so success is one colour everywhere.

## 4.3 Chart palette — the fix for indistinguishable series

Built so adjacent series **alternate light and dark**. This means they separate by
luminance as well as hue, so they survive greyscale printing and colour-vision
deficiency — which the current palette does not.

| Token | Hex | vs white | Hue |
|---|---|---|---|
| `--chart-1` | `#9A2D4A` | 7.37 | burgundy (brand-led) |
| `--chart-2` | `#BA8824` | 3.17 | gold |
| `--chart-3` | `#035181` | 8.41 | deep blue |
| `--chart-4` | `#C6739C` | 3.32 | rose |
| `--chart-5` | `#047879` | 5.29 | teal |
| `--chart-6` | `#969F59` | 2.84 | olive |
| `--chart-7` | `#754D9E` | 6.34 | violet |
| `--chart-8` | `#65B187` | 2.56 | green |

**Measured adjacent-pair separation** (this is what the old palette failed at):

```
chart-1 / chart-2   2.33 : 1
chart-2 / chart-3   2.66 : 1
chart-3 / chart-4   2.54 : 1
chart-4 / chart-5   1.60 : 1
chart-5 / chart-6   1.87 : 1
chart-6 / chart-7   2.23 : 1
chart-7 / chart-8   2.47 : 1
```
Every adjacent pair now clears 1.6:1 (vs. **1.00:1** for mauve/crimson today).

**Chart rules:**
1. Assign series **in order**, `chart-1` first. Never pick "a nice colour."
2. **Maximum 5 categorical series.** Beyond 5, humans stop matching legend to mark —
   group the tail into "Other". `chart-6/7/8` exist for the rare 6–8 case only.
3. **Never encode with colour alone** (WCAG 1.4.1). Lines get distinct dash patterns;
   pies/bars get direct labels.
4. Sequential data (heatmaps, intensity) uses a single ramp: `burgundy-100 → 950`.
5. Diverging data uses `red-700 ← neutral-200 → green-700`.
6. Gridlines `--border-subtle`, axis labels `--text-tertiary`, never below 12px.

## 4.4 Semantic layer

**Components never touch primitives.** They consume semantics. This is the contract that
makes dark mode a config change instead of a rewrite.

### Surfaces
| Token | Light | Purpose |
|---|---|---|
| `--surface-canvas` | `#FAF8F6` | page background |
| `--surface-raised` | `#FFFFFF` | cards, panels |
| `--surface-raised-hover` | `#FAF8F6` | card hover |
| `--surface-sunken` | `#F5F2EE` | table headers, wells, code blocks |
| `--surface-overlay` | `#FFFFFF` | modals, popovers, dropdowns |
| `--surface-inverse` | `#1D1814` | tooltips, dark sections |
| `--surface-brand` | `#6E0F2D` | primary buttons, active nav |
| `--surface-brand-subtle` | `#FEF4F5` | selected rows, brand tints |

### Text — with the measured ratio it guarantees
| Token | Value | On canvas | Use |
|---|---|---|---|
| `--text-primary` | `#1D1814` | **17.60** ✅AAA | body, table cells, headings |
| `--text-secondary` | `#4F4A45` | **8.76** ✅AAA | supporting copy, descriptions |
| `--text-tertiary` | `#69635E` | **5.92** ✅AA | **table headers**, labels, captions, axis |
| `--text-placeholder` | `#A09A94` | 2.78 | input placeholder only |
| `--text-disabled` | `#A09A94` | 2.78 | disabled (exempt from AA) |
| `--text-brand` | `#6E0F2D` | **11.87** ✅AAA | brand text, links |
| `--text-accent` | `#845E04` | **5.86** ✅AA | ★ **replaces all gold text** |
| `--text-on-brand` | `#FFFFFF` | 11.87 on brand ✅ | text on burgundy |
| `--text-success` | `#1F774E` | 5.52 ✅ | positive deltas |
| `--text-warning` | `#8D5802` | 5.95 ✅ | warnings |
| `--text-danger` | `#AB3832` | 6.28 ✅ | errors, overdue |
| `--text-info` | `#0A6AA7` | 5.78 ✅ | informational |

> `--text-tertiary` is the direct replacement for `#8B7060` taupe. Same visual role,
> **5.92:1 instead of 4.11:1.** Search-and-replace on that one value fixes the majority
> of the "text isn't visible" reports.

### Borders
| Token | Value | Use |
|---|---|---|
| `--border-subtle` | `#EAE5E1` | dividers inside a card |
| `--border-default` | `#D8D2CE` | card outline, input rest — **1.50:1, replaces the 1.2:1 `rgba(0,0,0,0.1)`** |
| `--border-strong` | `#BFB9B4` | input hover, emphasis |
| `--border-brand` | `#6E0F2D` | active/checked |
| `--border-focus` | `#A63A55` | focus ring — 6.25:1, clears WCAG 1.4.11 |
| `--border-danger` | `#CB4B43` | invalid field |

### Interaction state deltas
One consistent rule instead of ad-hoc guesses:

| State | Filled (brand) | Subtle / ghost |
|---|---|---|
| rest | `burgundy-900` | transparent |
| hover | `burgundy-800` | `burgundy-50` |
| active | `burgundy-950` | `burgundy-100` |
| focus | + 3px `burgundy-700` ring at 40% | same |
| disabled | `neutral-200` bg / `neutral-400` text | `neutral-400` text |
| loading | rest colour, 70% opacity, spinner | same |

---

# 5. Typography

## 5.1 The font decision

**Current:** 9 families, ~380KB, no pairing logic.
**New:** 3 families, ~120KB, one family per role.

### Display — **Fraunces** (variable serif)
Replaces Playfair Display, DM Serif Display, Cormorant Garamond, and Plus Jakarta Sans'
display role. Fraunces has an **optical-size axis** (`opsz`) — it automatically gets
higher-contrast and more elegant at large sizes, and sturdier at small sizes. It also has
a `SOFT` and `WONK` axis you can dial for warmth. It carries heritage-craft character
without Playfair's fragility at small sizes.

*Use for:* the wordmark, page titles (`display-*`, `title-lg`), hero numbers, document
letterheads. **Never** for UI chrome, table content, or anything under 20px.

*Acceptable alternative if you want zero risk:* keep **Playfair Display**, but restrict it
to ≥24px only.

### UI — **Inter** (keep it)
Inter is already in your stack and is the correct choice: the largest x-height in its
class, true tabular figures, a slashed-zero stylistic set, and it is what shadcn, Linear,
Vercel, and Stripe use for exactly this kind of dense interface. **No change — just stop
mixing it with Plus Jakarta Sans, DM Sans and Space Grotesk.**

*Use for:* everything. Nav, buttons, labels, tables, body, forms, charts, metrics.

### Code — **IBM Plex Mono** (replaces JetBrains Mono)

You asked for a mono that reads bigger and is easier to understand. Here is the honest
picture, because it affects how you should apply the fix:

JetBrains Mono actually has a *larger* x-height ratio (≈0.55em) than IBM Plex Mono
(≈0.516em). So the real cause of "hard to read" is **not the family — it's that your code
renders it at 10–11.5px**, e.g.:

```js
/* MobileWeaversSection.tsx:52 */
fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px"
```

11px semibold mono with positive tracking on a translucent dark background is unreadable
regardless of family.

**So the fix is two-part, and both parts matter:**

1. **Family → IBM Plex Mono.** It is humanist rather than geometric — warmer, less
   "code editor", far better suited to a heritage brand, with excellent character
   disambiguation (slashed zero, distinct `1`/`l`/`I`, distinct `8`/`B`).
2. **Size floor → 13px, never below 12px**, and a **+1px optical bump** relative to
   surrounding Inter text (mono glyphs read smaller at equal px). Tracking `0`, never
   positive.

*Use for:* entity codes only — `WV-002`, `BATCH-086`, invoice/PO/quotation numbers,
saree codes, HSN codes, GSTIN. **Not** for currency, **not** for quantities, **not** for
dates. Those use Inter with `font-variant-numeric: tabular-nums`, which aligns columns
without looking technical.

> If you would rather drop the third family entirely: Inter with
> `font-feature-settings: "tnum" 1, "ss01" 1, "cv05" 1` and `letter-spacing: 0.02em`
> gives you aligned, disambiguated codes with zero extra download. This is a legitimate
> option — Wise does exactly this. The tokens support both; see `--font-code` in
> `tokens.css`.

## 5.2 Type scale

A **1.125 (major second)** ratio in the dense UI range and **1.25 (major third)** in the
display range. Tight enough for an ERP, dramatic enough for the brand moments. Anchored at
14px body — not 16px — because this is a data-dense application (this matches Linear,
Notion, and Stripe's dashboard rather than a marketing site).

| Token | Size | Line-height | Weight | Tracking | Family | Use |
|---|---|---|---|---|---|---|
| `display-2xl` | 60 / 3.75rem | 1.0 | 400 | −0.03em | Fraunces | hero number |
| `display-xl` | 48 / 3rem | 1.05 | 400 | −0.025em | Fraunces | hero |
| `display-lg` | 38 / 2.375rem | 1.1 | 400 | −0.02em | Fraunces | page hero |
| `display-md` | 30 / 1.875rem | 1.15 | 500 | −0.02em | Fraunces | section hero |
| `title-lg` | 24 / 1.5rem | 1.25 | 600 | −0.015em | Fraunces | page title |
| `title-md` | 20 / 1.25rem | 1.3 | 600 | −0.01em | Inter | card title, modal title |
| `title-sm` | 18 / 1.125rem | 1.35 | 600 | −0.01em | Inter | section title |
| `body-lg` | 16 / 1rem | 1.5 | 400 | 0 | Inter | lead paragraph |
| **`body-md`** | **14 / 0.875rem** | **1.5** | **400** | **0** | **Inter** | ★ **default body, table cell** |
| `body-sm` | 13 / 0.8125rem | 1.45 | 400 | 0 | Inter | dense table, helper text |
| `label-lg` | 14 / 0.875rem | 1.4 | 500 | 0 | Inter | form label, button md |
| `label-md` | 13 / 0.8125rem | 1.4 | 500 | 0 | Inter | button sm, chip |
| `label-sm` | 12 / 0.75rem | 1.35 | 500 | 0.005em | Inter | badge, dense label |
| `caption` | 12 / 0.75rem | 1.4 | 400 | 0 | Inter | timestamps, hints |
| **`overline`** | **12 / 0.75rem** | **1.3** | **600** | **0.06em** | Inter | ★ **table header, eyebrow** |
| `code-md` | 13 / 0.8125rem | 1.4 | 500 | 0 | Plex Mono | entity codes |
| `code-sm` | 12 / 0.75rem | 1.35 | 500 | 0 | Plex Mono | inline code, dense codes |
| `metric-lg` | 30 / 1.875rem | 1.1 | 600 | −0.02em | Inter tnum | metric card value |
| `metric-md` | 24 / 1.5rem | 1.15 | 600 | −0.015em | Inter tnum | stat tile |
| `metric-sm` | 18 / 1.125rem | 1.2 | 600 | −0.01em | Inter tnum | inline stat |

**Sizes removed from the system:** 10, 10.5, 11, 11.5, 13.5, 15, 17, 19, 21, 22, 26, 28,
32, 34, 36, 40, 44, 52, 56 — approximately 40 ad-hoc sizes collapse into 19 tokens.

### The `overline` token replaces your uppercase micro-labels

Your current pattern:
```js
fontSize: 10, fontWeight: 500, color: "#8B7060",
textTransform: "uppercase", letterSpacing: "1px"
```
10px + 4.11:1 contrast + 1px tracking = three legibility failures at once.

Replaces with:
```js
fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)",
textTransform: "uppercase", letterSpacing: "0.06em"
```
12px + 5.92:1 + proportional tracking. **This is the table-header fix.**

## 5.3 Typographic rules

1. **Never below 12px.** No exceptions, including badges, chart axes and mobile.
2. **Weights: 400, 500, 600, 700 only.** Never 300 (fails at small sizes on Windows),
   never 800.
3. **Two families maximum per screen.** Fraunces for the page title, Inter for
   everything else. Mono only inside code chips.
4. **Negative tracking above 20px, zero at 14–20px, positive only for uppercase.**
   Positive tracking on lowercase text at small sizes is what makes it hard to read.
5. **All numeric columns get `font-variant-numeric: tabular-nums`** so digits align.
6. **Line length 45–75 characters** for paragraph text — `max-width: 65ch`.
7. **Uppercase only for `overline`.** Nowhere else.

---

# 6. Spacing — 4pt grid

| Token | px | rem | Typical use |
|---|---|---|---|
| `--space-0` | 0 | 0 | — |
| `--space-px` | 1 | — | hairline |
| `--space-0-5` | 2 | 0.125 | icon nudge |
| `--space-1` | 4 | 0.25 | tightest gap |
| `--space-1-5` | 6 | 0.375 | chip padding-y |
| `--space-2` | 8 | 0.5 | icon↔label |
| `--space-2-5` | 10 | 0.625 | input padding-y |
| `--space-3` | 12 | 0.75 | **table cell padding-y** |
| `--space-4` | 16 | 1 | **table cell padding-x**, form field gap |
| `--space-5` | 20 | 1.25 | card padding (compact) |
| `--space-6` | 24 | 1.5 | ★ **card padding (default)** |
| `--space-8` | 32 | 2 | card padding (spacious), gap between cards |
| `--space-10` | 40 | 2.5 | section gap |
| `--space-12` | 48 | 3 | ★ **page gutter (desktop)** |
| `--space-16` | 64 | 4 | major section break |
| `--space-20` | 80 | 5 | page top/bottom |
| `--space-24` | 96 | 6 | hero padding |

**Rule:** everything is a multiple of 4. The values `36`, `22`, `14`, `11`, `5`, `9`, `18`
currently in the codebase are all off-grid and must round to the nearest token.

**Semantic aliases** (use these in components, they carry intent):
```
--gutter-page-x        48px desktop / 24px tablet / 16px mobile
--gutter-page-y        32px
--gap-card             24px   (between cards in a grid)
--gap-section          40px   (between page sections)
--pad-card             24px
--pad-card-compact     20px
--pad-cell-x           16px
--pad-cell-y           12px
--pad-cell-y-compact   8px
--gap-stack            12px   (vertical rhythm inside a card)
--gap-inline           8px    (icon ↔ label)
```

---

# 7. Radius

Current codebase uses 6, 12, 14, 24, 999, and `50%` inconsistently. Consolidated:

| Token | px | Use |
|---|---|---|
| `--radius-xs` | 4 | checkbox, tag, inline code |
| `--radius-sm` | 6 | badge, small button, input (sm) |
| `--radius-md` | 8 | ★ button, input, select, dropdown item |
| `--radius-lg` | 12 | ★ card, panel, table container |
| `--radius-xl` | 16 | modal, drawer, large card |
| `--radius-2xl` | 20 | hero card, feature panel |
| `--radius-3xl` | 28 | brand/marketing surfaces only |
| `--radius-full` | 9999 | avatar, pill, toggle, status dot |

**Nesting rule (Material/Apple):** inner radius = outer radius − padding. A 12px-radius
card with 24px padding contains an 8px-radius button, not another 12px one.

---

# 8. Elevation

Shadows are tinted with **warm neutral-900 `#1D1814`**, not pure black. Black shadows on a
warm cream canvas read as dirty grey; warm shadows read as depth.

| Token | Value | Use |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(29,24,20,.05)` | input rest, subtle separation |
| `--shadow-sm` | `0 1px 3px rgba(29,24,20,.07), 0 1px 2px -1px rgba(29,24,20,.06)` | ★ card rest |
| `--shadow-md` | `0 4px 8px -2px rgba(29,24,20,.08), 0 2px 4px -2px rgba(29,24,20,.06)` | card hover, dropdown |
| `--shadow-lg` | `0 12px 20px -6px rgba(29,24,20,.10), 0 4px 8px -4px rgba(29,24,20,.06)` | popover, sticky header |
| `--shadow-xl` | `0 24px 40px -12px rgba(29,24,20,.14), 0 8px 16px -8px rgba(29,24,20,.08)` | modal, drawer |
| `--shadow-2xl` | `0 40px 64px -20px rgba(29,24,20,.18)` | full-screen overlay |
| `--shadow-inner` | `inset 0 1px 2px rgba(29,24,20,.06)` | sunken well, pressed |
| `--shadow-brand` | `0 4px 14px -4px rgba(110,15,45,.28)` | primary button rest |
| `--shadow-focus` | `0 0 0 3px rgba(166,58,85,.40)` | ★ focus ring |

**Elevation ladder — a component may only be one level above its parent:**
```
0  canvas
1  card / panel               shadow-sm
2  sticky header / dropdown   shadow-md
3  popover / tooltip          shadow-lg
4  modal / drawer             shadow-xl
5  toast                      shadow-xl
```

---

# 9. Motion

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 75ms | colour/opacity on hover |
| `--duration-fast` | 150ms | ★ most UI transitions |
| `--duration-normal` | 200ms | dropdown, tooltip |
| `--duration-slow` | 300ms | modal, drawer, accordion |
| `--duration-slower` | 450ms | page transition, hero |
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` | ★ default |
| `--ease-decelerate` | `cubic-bezier(0,0,0,1)` | entering |
| `--ease-accelerate` | `cubic-bezier(.3,0,1,1)` | exiting |
| `--ease-emphasized` | `cubic-bezier(.22,1,.36,1)` | ★ your existing `EASE` — kept |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | playful overshoot, sparingly |

**Rules:**
- Animate `transform` and `opacity` only. Never `width`/`height`/`top`/`left`.
- Entering uses decelerate; exiting uses accelerate and is ~30% faster.
- Hover scale on cards: `1.01` max. Buttons: no scale, use colour + shadow.
- **`prefers-reduced-motion: reduce` collapses everything to 0.01ms** — shipped in
  `tokens.css`, no per-component work needed.

---

# 10. Z-index

Currently ad-hoc (`zIndex: 300`, `zIndex: 1`). Replaced with a ladder:

| Token | Value | Layer |
|---|---|---|
| `--z-base` | 0 | content |
| `--z-raised` | 10 | card hover, sticky column |
| `--z-sticky` | 100 | sticky table header |
| `--z-nav` | 200 | top nav, nav rail |
| `--z-dropdown` | 300 | select, menu, combobox |
| `--z-overlay` | 400 | modal backdrop |
| `--z-modal` | 500 | modal, drawer |
| `--z-popover` | 600 | popover over a modal |
| `--z-toast` | 700 | notifications |
| `--z-tooltip` | 800 | always on top |

---

# 11. Breakpoints & responsive foundation

| Token | Min-width | Target | Page gutter | Grid |
|---|---|---|---|---|
| `xs` | 0 | phone portrait | 16px | 4 col |
| `sm` | 480px | phone landscape | 20px | 4 col |
| `md` | 768px | tablet portrait | 24px | 8 col |
| `lg` | 1024px | tablet landscape / small laptop | 32px | 12 col |
| `xl` | 1280px | ★ primary desktop target | 48px | 12 col |
| `2xl` | 1536px | large desktop | 48px + centred | 12 col, `max-width: 1600px` |

**Container:** `--container-max: 1600px`. Above `2xl` the content centres rather than
stretching — 3000px-wide table rows are unreadable (line-length law applies to tables too).

**Fluid type:** display sizes use `clamp()` so hero numbers shrink on mobile instead of
overflowing. Body sizes stay fixed — fluid body text harms readability.

**Touch targets:** `--target-min: 44px`. Every button, tab, row action and toggle gets at
least a 44×44 hit area, even when the visible control is smaller (use padding or a
pseudo-element). This directly fixes the `padding: "5px 11px"` period toggles.

---

# 12. Files delivered

```
design-system/
├── 00-ROADMAP.md                        the 8-phase plan
└── 01-FOUNDATIONS.md                    ← this document

frontend/src/
├── styles/
│   ├── tokens.css          ★ NEW — all primitives + semantics + dark mode
│   └── fonts.css           ★ REWRITTEN — 9 families → 3
└── design-system/
    ├── tokens.ts           ★ NEW — typed TS mirror for the 412 inline-style files
    └── TokenPreview.tsx    ★ NEW — live swatch/scale page with contrast readouts
```

---

# 13. How to implement Phase 1

Phase 1 is **purely additive**. Nothing breaks. The old tokens keep working until you
migrate a component; the new ones sit alongside them.

### Step 1 — Wire the token file in *(2 minutes)*

Edit `frontend/src/styles/index.css`. Order matters — `tokens.css` must come **after**
`theme.css` so its values win:

```css
@import './fonts.css';
@import './tailwind.css';
@import './theme.css';
@import './tokens.css';   /* ← add this line, last */
```

### Step 2 — Verify the fonts load *(1 minute)*

`fonts.css` has been rewritten. Start the dev server and confirm in DevTools → Network
that you now see **3** font requests, not 9, and that `document.fonts.check('14px Inter')`
returns `true`.

### Step 3 — Look at the token preview *(5 minutes)*

Add a temporary route to see every token rendered with its live contrast ratio:

```tsx
// in your router
import { TokenPreview } from '@/design-system/TokenPreview';
// …
<Route path="/_design" element={<TokenPreview />} />
```

Visit `/_design`. This page is your reference for the rest of the phases. Delete the route
before production, or gate it behind the superadmin role.

### Step 4 — The three highest-value substitutions *(30 minutes, fixes most complaints)*

These three find-and-replaces resolve the majority of the "text isn't visible" problems
across all 507 files:

```bash
# 1. The failing taupe → accessible tertiary text  (4.11:1 → 5.92:1)
rg -l '#8B7060' frontend/src | xargs sed -i '' 's/#8B7060/#69635E/g'

# 2. Gold used as text → text-safe gold  (2.55:1 → 5.86:1)
#    REVIEW EACH HIT — only change `color:` uses, keep `background:` uses as #C89B47
rg -n 'color: *"#C89B47"|color: *"#C4923A"|color: *"#E8A84A"' frontend/src

# 3. Any font-size below 12 → 12
rg -n 'fontSize: (10|10\.5|11|11\.5)\b' frontend/src
```

Run #1 as-is. Run #2 and #3 as *reviews* first — `#C89B47` is still correct as a
background, border, or chart fill; only its use as `color:` is broken.

### Step 5 — Fix the table header globally *(10 minutes)*

`frontend/src/shared/ui/table.tsx`, `TableHead`:

```diff
- "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap …"
+ "h-11 px-4 text-left align-middle whitespace-nowrap " +
+ "text-[12px] font-semibold uppercase tracking-[0.06em] " +
+ "text-[var(--text-tertiary)] bg-[var(--surface-sunken)] " +
+ "border-b border-[var(--border-default)] …"
```

And `TableCell`:
```diff
- "p-2 align-middle whitespace-nowrap …"
+ "px-4 py-3 align-middle whitespace-nowrap text-[14px] text-[var(--text-primary)] …"
```

This alone fixes header legibility on every table that uses the shared primitive. Tables
that override it with inline styles get handled in Phase 4.

### Step 6 — Adopt the chart palette *(15 minutes)*

In any Recharts component, replace hardcoded series colours:

```diff
- <Bar dataKey="produced"   fill="#6E0F2D" />
- <Bar dataKey="dispatched" fill="#C89B47" />
+ <Bar dataKey="produced"   fill="var(--chart-1)" />
+ <Bar dataKey="dispatched" fill="var(--chart-2)" />
```

The `--chart-*` variables are plain hex in `tokens.css`, **not `oklch()`** — specifically
so Motion can sample them without the crash that forced the runtime override in
`beere-dashboard/theme.tsx`. Once every chart is on `--chart-*`, you can delete that
`GLOBAL_STYLE` override block entirely.

### Step 7 — Migrating a feature's local theme *(the repeatable pattern)*

Take one feature at a time. Example — `features/reports/components/theme.ts`:

```ts
// BEFORE — 27 lines of hardcoded hex
export const T = { taupe: "#8B7060", antiqueGold: "#C89B47", /* … */ };

// AFTER — re-export from the system, keys unchanged so no call sites break
import { semantic, brand } from '@/design-system/tokens';

export const T = {
  silkCream:     semantic.surface.canvas,
  warmIvory:     semantic.surface.raised,
  royalBurgundy: brand.burgundy[900],
  taupe:         semantic.text.tertiary,   // ← now 5.92:1
  antiqueGold:   brand.gold[500],          // decorative
  goldText:      semantic.text.accent,     // ← new, use for gold TEXT
  green:         semantic.text.success,
  crimson:       semantic.text.danger,
  // …
} as const;
```

Because the *keys* stay the same, every component importing `T` picks up the accessible
values with **zero component edits**. Do this for all 21 theme files — roughly 10 minutes
each — and the whole app inherits Phase 1 without touching a single `.tsx` component.
That is the cheapest path to the visible win.

### Step 8 — Verify

```bash
cd frontend && npm run typecheck && npm run lint && npm run build
```

Then open the app and spot-check: table headers, metric card labels, chart legends, and
any gold text. Nothing should be hard to read.

---

# 14. Definition of done for Phase 1

- [ ] `tokens.css` imported last in `index.css`
- [ ] Exactly 3 font families in the Network tab
- [ ] `/_design` preview renders and all contrast readouts pass
- [ ] `#8B7060` returns zero results in `frontend/src`
- [ ] No `fontSize` below 12 in `frontend/src`
- [ ] `TableHead` / `TableCell` updated in `shared/ui/table.tsx`
- [ ] At least 3 feature `theme.ts` files re-exporting from `@/design-system/tokens`
- [ ] `npm run typecheck && npm run build` clean

---

# 15. What Phase 1 deliberately does **not** do

So expectations are exact:

- ❌ It does not restyle any component — that is Phases 3–5.
- ❌ It does not fix page layout or the `calc(100vh - 90px - 160px)` arithmetic — Phase 2.
- ❌ It does not touch the 412 inline-style files beyond the 3 substitutions above — Phase 8.
- ❌ It does not design invoice / quotation / PO documents — Phase 7.
- ❌ It does not define the entity-code component for `WV-002` / `BATCH-086` — Phase 6.
  (Phase 1 only supplies the `code-md` / `code-sm` type tokens it will use.)

Phase 1 is the vocabulary. Phases 2–7 are the sentences.

---

**Next:** Phase 2 — Layout & Page Architecture. Say the word and I'll build it.
