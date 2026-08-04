# BK LOOM DESIGN SYSTEM
# Phase 5 — Navigation, Overlays & Feedback

**Scope:** Top nav, group bar, section bar, breadcrumbs, tabs, mobile nav, command palette, search, filter bar, dropdown menu, context menu, Modal/Dialog/Drawer/Sheet, Popover, Toast, Alert, Banner, confirmation patterns, and the complete **date system** (picker, range, calendar, month/year).
**Depends on:** Phase 1 (z-index ladder, motion, colour), Phase 2 (shell geometry, IA), Phase 3 (Button, Input, Field, Icon), Phase 4 (filter contract).
**Blocks:** Phases 6–7.

---

# PART A — THE AUDIT

## A.1 63 modals, zero of them are dialogs

```
Files named *modal* / *dialog* / *drawer* / *sheet*    63
position: "fixed" overlays                             96
<AnimatePresence> instances                           382

role="dialog"                                            0
aria-modal                                                0
Escape key handlers                                       0
Focus trap implementations                                0
Focus restore (.focus() calls)                             6
Body scroll lock (body.style.overflow)                      3
Features importing Radix Dialog                              0
```

**Zero.** Not "few" — zero. Across 63 modal implementations:

| Failure | WCAG | Consequence |
|---|---|---|
| No `role="dialog"` / `aria-modal` | **4.1.2** | Screen readers announce nothing; the modal is invisible to AT |
| No `Escape` handler | **2.1.2** | The only way out is finding and clicking the × |
| No focus trap | **2.4.3** | Tab moves focus *behind* the modal into the page underneath |
| No focus restore | **2.4.3** | After close, focus jumps to `<body>` — keyboard users restart from the top |
| No scroll lock (60/63) | — | The background scrolls under the modal on wheel/trackpad |
| No initial focus | **2.4.3** | The modal opens with focus still on the trigger behind the scrim |

`shared/ui/dialog.tsx` — a correct Radix implementation with all of the above — exists and has **zero importers**, same as every other primitive in Phase 3's audit.

## A.2 The z-index situation

**41 distinct z-index values**, spanning `0` to `100000`:

```
0 ×3      1 ×46     2 ×42      3 ×3      5 ×3      6 ×1      8 ×2
10 ×20    20 ×20    30 ×1     40 ×2     50 ×12   100 ×12  110 ×2
180 ×1   190 ×1    199 ×2    200 ×11   250 ×3   300 ×13  400 ×13
450 ×1   500 ×9    600 ×3    800 ×3    900 ×4   950 ×1   999 ×3
1000 ×10 1200 ×1  1250 ×1   1300 ×2  1400 ×3  1500 ×2  1800 ×1
2000 ×2  2050 ×1  2100 ×2   9000 ×2  9100 ×1  9200 ×1  9999 ×8
99999 ×2  100000 ×1
```

The `9999 / 99999 / 100000` cluster is the signature of an escalation war — each new overlay outbidding the last. `100000` means someone hit a stacking bug and there was nowhere left to go.

Phase 1 shipped a 10-step ladder (`--z-base` … `--z-tooltip`). Nothing uses it yet.

## A.3 Ten different scrims

```
rgba(0,0,0,0.02) ×8     rgba(0,0,0,0.15) ×12    rgba(0,0,0,0.18) ×10
rgba(0,0,0,0.22) ×6     rgba(0,0,0,0.25) ×14    rgba(0,0,0,0.32) ×15
rgba(0,0,0,0.40) ×8     rgba(0,0,0,0.45) ×5     rgba(0,0,0,0.55) ×5
rgba(0,0,0,0.60) ×10
```

Ten opacities for one concept. All pure black — against a warm cream canvas, black scrims read grey-green rather than as a dimmed version of the page. Phase 1 defines one: `--surface-scrim: rgba(29,24,20,0.48)`.

`rgba(0,0,0,0.02)` at 2% isn't a scrim at all — it's an invisible click-catcher, which means clicking "outside" gives no visual signal that a layer is open.

## A.4 Toast: configured correctly, barely used

```jsx
// app/App.tsx:110  — this part is right
<Toaster position="top-right" richColors />
```

But across the whole app:
```
toast.success(   10
toast.error(      2
toast.info(       0
toast.warning(    0
toast.promise(    0
```

**12 toast calls for an ERP with hundreds of mutating actions.** Saving a batch, issuing material, recording a payment, generating a PO — almost none confirm they worked. Sonner has no `aria-live` configuration set either, so the 12 that do fire are silent to screen readers (WCAG 4.1.3).

## A.5 The date system

`DateFilterBar` is genuinely good architecture — one shared filter across Weavers, Batches, Goods Receipt, Material Issuance, External Purchases and five Payments views, with a clean `matchesDateFilter` predicate and five modes (`all` / `day` / `range` / `month` / `year`).

But:

```js
const DFB_T = { taupe: "#8B7060", … };            // 23rd theme file, failing taupe
const DFB_F = { ui: "'Inter', sans-serif" };
const inputStyle = { height: 38, fontSize: 12.5, borderRadius: 10, border: "1.5px solid …" };
```

| Issue | Detail |
|---|---|
| Native `type="date"` | **14 instances.** Renders completely differently on Chrome / Safari / Firefox / iOS; unstyleable; the picker is OS-chrome with no brand |
| Font size `12.5` | Off-scale, and off-grid |
| Height `38` | Not on the 4pt grid, and below the 44px target |
| `taupe` labels | 4.11:1 — same failure as everywhere else |
| No calendar UI | `react-day-picker` is a dependency; `shared/ui/calendar.tsx` exists; **0 features use it** |
| No presets | No "Last 30 days" / "This quarter" / "This financial year" — critical for an Indian business (Apr–Mar FY) |
| Range validation | `from` can exceed `to` with no feedback |

## A.6 Dropdown state is hand-managed everywhere

```
showProfile     52      openGroup       17      setOpenGroup    11
showNotif       27      setOpenSaree    14      setOpenDesign   10
setOpenQuotation 6      showMenu         2
```

Every one is a bare `useState` + a click-outside handler (or none). None have `aria-expanded`, `aria-controls`, roving focus, type-ahead, or `Escape`. The `TopNav` group menus use `mouseenter` with a 140ms close timer — unusable on touch and hostile to motor-impaired users.

## A.7 Summary

| | Have | Need |
|---|---|---|
| Modal implementations | 63, all hand-rolled | 1 `Modal` + 1 `Drawer` |
| `role="dialog"` | 0 | all |
| Escape handlers | 0 | all |
| Focus traps | 0 | all |
| Scroll locks | 3 / 63 | all |
| z-index values | 41 (0 → 100000) | 10 tokens |
| Scrim opacities | 10 | 1 |
| Toast calls | 12 | every mutation |
| Native date inputs | 14 | 0 |
| Calendar UI | 0 | 1 |
| Date presets | 0 | 8 |
| Dropdowns with ARIA | 0 | all |

---

# PART B — PRINCIPLES

| # | Principle | Mechanism |
|---|---|---|
| **O1** | **Every overlay is a Radix primitive.** | Focus trap, `Escape`, scroll lock, portal and ARIA come free and correct. |
| **O2** | **One scrim, one ladder.** | `--surface-scrim` and the 10 z-tokens. No number outside the ladder ships. |
| **O3** | **Interruption is expensive.** | Modal only when the user must decide before continuing. Everything else is inline, a popover, or a toast. |
| **O4** | **Focus is a contract.** | Opens → into the layer. Closes → back to the trigger. Always. |
| **O5** | **Every mutation gets feedback.** | Optimistic UI + toast, or inline confirmation. Silence is a bug. |
| **O6** | **Destructive actions are typed, not just clicked.** | Confirmation names what is being destroyed; irreversible ones require typing. |
| **O7** | **Dates are a component, never a native input.** | One calendar, one locale, one format, one financial year. |

---

# PART C — THE OVERLAY LAYER CONTRACT

Every overlay in Phase 5 conforms to this. It's what turns 63 bespoke modals into one predictable behaviour.

## C.1 The stacking ladder — enforced

```
--z-base      0    page content
--z-raised    10   card hover, sticky column
--z-sticky    100  sticky table header, sticky toolbar
--z-nav       200  topbar, groupbar
--z-dropdown  300  select, menu, combobox, popover anchored to page content
--z-overlay   400  modal / drawer scrim
--z-modal     500  modal, drawer
--z-popover   600  popover or select opened *from inside* a modal
--z-toast     700  toasts
--z-tooltip   800  tooltips — always on top
```

**Radix portals everything to `document.body`,** so the ladder is the only thing that matters — no parent `overflow`, `transform` or `filter` can trap a layer. This removes the entire class of bug that produced `z-index: 100000`.

## C.2 Scrim

```css
.bk-scrim {
  position: fixed; inset: 0;
  background: var(--surface-scrim);        /* rgba(29,24,20,0.48) — warm, one value */
  backdrop-filter: blur(2px);
  z-index: var(--z-overlay);
}
.bk-scrim[data-state="open"]   { animation: fade-in  var(--duration-normal) var(--ease-decelerate); }
.bk-scrim[data-state="closed"] { animation: fade-out var(--duration-fast)   var(--ease-accelerate); }
```
48% is deliberate: enough that the page reads as inactive, light enough that context is retained. `backdrop-filter: blur(2px)` does the perceptual work that raising opacity to 60% was doing.

## C.3 Focus contract

| Moment | Behaviour |
|---|---|
| Open | Focus moves to the first focusable element — or the **least destructive** action in a confirmation |
| While open | Focus is trapped; `Tab` cycles within the layer |
| `Escape` | Closes the topmost layer only |
| Close | Focus returns to the **trigger element**, always |
| Nested | Each layer traps independently; `Escape` unwinds one at a time |
| Autofocus | Never on a destructive button. Never on a text input on mobile (it opens the keyboard and hides the dialog) |

## C.4 Scroll lock

Radix handles it, including scrollbar-width compensation so the page doesn't shift 15px when a modal opens — a jump visible in the current implementation's 3 hand-rolled locks.

## C.5 Motion

| Layer | Enter | Exit |
|---|---|---|
| Scrim | fade, `--duration-normal` `--ease-decelerate` | fade, `--duration-fast` `--ease-accelerate` |
| Modal | fade + `translateY(8px)` + `scale(0.98)`, `--duration-normal` | fade + `scale(0.98)`, `--duration-fast` |
| Drawer | `translateX/Y(100%)` → 0, `--duration-slow` `--ease-emphasized` | reverse, `--duration-normal` |
| Popover / Menu | fade + `translateY(4px)`, `--duration-fast` `--ease-decelerate` | fade, `--duration-instant` |
| Toast | slide from edge + fade, `--duration-normal` | fade + `scale(0.96)`, `--duration-fast` |

Exit is always faster than enter. Everything collapses under `prefers-reduced-motion` via Phase 1's global rule. **Replaces 382 hand-tuned `AnimatePresence` blocks.**

---

# PART D — MODAL / DIALOG

## D.1 Sizes

| Size | Width | Use |
|---|---|---|
| `xs` | 400 | Confirmation |
| `sm` | 480 | Single-field form, simple prompt |
| `md` | 640 | ★ default — standard form |
| `lg` | 800 | Multi-column form, detail view |
| `xl` | 1000 | Document preview (invoice, PO) |
| `full` | `calc(100vw - 64px)` | Data-heavy editors |

```
max-height:  calc(100dvh - 96px)     /* body scrolls; header + footer stay fixed */
radius:      var(--radius-xl)        /* 16 */
background:  var(--surface-overlay)
shadow:      var(--shadow-xl)
z-index:     var(--z-modal)
```

**Mobile (<768):** every size becomes a bottom sheet — full width, `--radius-xl` top corners only, drag-to-dismiss handle, `max-height: 92dvh`.

## D.2 Anatomy

```
┌────────────────────────────────────────────┐
│  Record payment                       [✕]  │  header — sticky
│  Invoice INV-2026-0142 · Sri Silks         │  subtitle, --text-secondary
├────────────────────────────────────────────┤
│                                            │
│  … body — the only scrolling region …      │
│                                            │
├────────────────────────────────────────────┤
│                    [Cancel]  [Record ₹8,400]│  footer — sticky
└────────────────────────────────────────────┘
```

```
header:   padding 24 24 16 · title  title-md 20/600 · close IconButton ghost sm
body:     padding 0 24     · overflow-y auto · overscroll-behavior contain
footer:   padding 16 24 24 · border-top --border-subtle · buttons end-aligned, gap 8
```

**A shadow appears under the header and above the footer when the body is scrolled** — so it's obvious content is cut off. Detected with `scrollTop > 0` / `scrollHeight - scrollTop > clientHeight`.

## D.3 API

```tsx
<Modal open={open} onOpenChange={setOpen} size="md">
  <Modal.Header title="Record payment" subtitle="INV-2026-0142 · Sri Silks" />
  <Modal.Body>
    <FieldGroup columns={2}>…</FieldGroup>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="tertiary" onClick={close}>Cancel</Button>
    <Button variant="primary" loading={saving}>Record ₹8,400</Button>
  </Modal.Footer>
</Modal>
```

`Modal.Header` generates the `id` wired to `aria-labelledby`; the subtitle wires `aria-describedby`. **Impossible to ship an unlabelled dialog.**

## D.4 Rules

| Rule | Reason |
|---|---|
| **No nested modals.** Use a drawer over a modal, or a multi-step modal | Nested modals destroy the mental model and the focus stack |
| Footer button order: `[tertiary] [secondary] [primary]` | Confirmed by the Phase 3 hierarchy; consistent across the app |
| Primary label states the action: "Record ₹8,400", not "OK" | Users read the button, not the body copy |
| **Click-outside does not close a form modal** with unsaved changes | Prompts "Discard changes?" instead |
| `Escape` on a dirty form prompts too | Same guard |
| Multi-step modals show a stepper and keep the same height | Prevents the dialog resizing under the cursor |
| Loading disables the footer, not the whole body | The user can still read what they're confirming |

---

# PART E — DRAWER / SHEET

For contextual detail that shouldn't lose page context — weaver profile, saree detail, filters on mobile.

```
side:       right (default) · left · bottom
width:      sm 400 · md 520 · lg 720 · full 100vw
            bottom: height auto, max 92dvh
radius:     0 (edge-anchored) · --radius-xl on the inner corners for bottom
shadow:     --shadow-xl
z-index:    --z-modal
scrim:      yes for md+ · optional for sm (non-modal inspector)
```

| Modal vs Drawer | |
|---|---|
| **Modal** | A decision. Blocks. The user must resolve it. |
| **Drawer** | Detail or a secondary task. Context stays visible. Often dismissible by clicking the page. |

Bottom drawers on mobile support drag-to-dismiss with a velocity threshold, and a 32×4 grab handle. This replaces the ad-hoc mobile modals in `MobileNavDrawer.tsx`.

---

# PART F — POPOVER

Non-modal, anchored, may contain interactive content (unlike a Tooltip).

```
background:  --surface-overlay      border: 1px --border-default
radius:      --radius-lg  12        shadow: --shadow-lg
padding:     var(--space-4)         max-width: 320
z-index:     --z-dropdown (300) · --z-popover (600) inside a modal
placement:   auto-flip + shift via Radix collision detection
offset:      8px from the anchor            arrow: optional 8px
```

| Rule | |
|---|---|
| Opens on **click**, never hover | Hover popovers are unreachable on touch and hostile to tremor |
| `aria-expanded` + `aria-controls` on the trigger | |
| `Escape` closes, focus returns to the trigger | |
| Click-outside closes | |
| Never contains another popover | Use a menu with submenus instead |

**Use for:** column visibility, quick edit, help content with a link, a filter's option list.

---

# PART G — DROPDOWN MENU & CONTEXT MENU

Replaces the 129 hand-managed `showProfile` / `showNotif` / `openGroup` / `setOpenSaree` state machines.

```
min-width:   200 (or trigger width)      max-height: 320, then scrolls
padding:     var(--space-1)  4           radius: --radius-lg 12 (outer)
item:        h 40 · px 12 · radius --radius-sm 6 (inner = outer − padding)
             hover/focus  --bk-neutral-50
             icon 16 left, --text-tertiary
             shortcut right, --text-tertiary, label-sm
destructive: --text-danger, hover --surface-danger-subtle, always last, above a separator
separator:   1px --border-subtle, margin 4 0
label:       Phase 1 `overline`, px 12, py 6
checkbox/radio items: Check / Dot indicator left, 20px slot
submenu:     ChevronRight right, opens on hover after 150ms or on →
```

**Keyboard:** `↑ ↓` navigate (wrapping) · `→` open submenu · `←` close · type-ahead · `Home`/`End` · `Enter`/`Space` activate · `Esc` closes one level.

**The `TopNav` group menus convert from `mouseenter` + 140ms timer to click-triggered `DropdownMenu`** — with `aria-expanded`, real focus management, and touch support.

**Context menu** shares the component, triggered by right-click, with a long-press equivalent on touch. Right-click is a shortcut, never the only path to an action.

---

# PART H — COMMAND PALETTE

`cmdk` is already a dependency and unused. For an app with 17 destinations and hundreds of records, this is the highest-leverage navigation improvement available.

```
trigger:     ⌘K / Ctrl+K  (plus a visible button in the topbar search slot)
width:       min(640px, calc(100vw - 32px))
position:    top 20vh, centred
z-index:     --z-modal
```

```
┌──────────────────────────────────────────┐
│ 🔍  Search or jump to…                   │
├──────────────────────────────────────────┤
│ RECENT                                   │
│  📄 INV-2026-0142                        │
│  👤 Ravi Kumar · WV-001                  │
│ ACTIONS                                  │
│  ＋ Add saree                      ⌘⇧S   │
│  ＋ Record payment                 ⌘⇧P   │
│ NAVIGATE                                 │
│  📦 Inventory                            │
│ WEAVERS                                  │
│  👤 Padma Veni · WV-002                  │
├──────────────────────────────────────────┤
│ ↑↓ navigate   ↵ select   esc close       │
└──────────────────────────────────────────┘
```

Groups: Recent → Actions → Navigate → then entity results (Weavers, Sarees, Batches, Invoices, Customers) resolved async with a 200ms debounce. Entity codes are matched exactly first — typing `WV-002` jumps straight there.

`role="combobox"` + `aria-activedescendant`; results announced via `aria-live="polite"`.

---

# PART I — SEARCH

| Variant | Placement | Behaviour |
|---|---|---|
| **Global** | Topbar | Opens the command palette. Not an input — a button showing `Search  ⌘K` |
| **Scoped** | Table toolbar | `SearchInput` (Phase 3), 300ms debounce, filters in place, `Esc` clears |
| **Inline** | Combobox | Filters options within a dropdown |

Scoped search rules: searches **all visible columns** unless scoped explicitly; shows `"12 of 412 match"` beside the input; matched substrings get `<mark>` at `--surface-accent-subtle` (the one legitimate use of gold — as a highlight ground, never as text).

---

# PART J — FILTER BAR

Satisfies the `ColumnDef.filterType` contract from Phase 4.

```
┌───────────────────────────────────────────────────────────────┐
│ [🔍 Search sarees        ] [Status ▾] [Weaver ▾] [Date ▾] [⋯] │
├───────────────────────────────────────────────────────────────┤
│ Status: In Production ×   Weaver: Ravi ×   Clear all          │
└───────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Filter trigger | `Button variant="secondary" size="sm"` + `ChevronDown`; shows a count badge when active |
| Active filters | Phase 3 `Chip` row; "Clear all" appears past 3 |
| Overflow | Past 4 filters, the rest collapse into `[⋯ More filters]` → Popover |
| Mobile | All filters collapse into one `[Filters (3)]` button → bottom Drawer with `[Apply]` / `[Reset]` |
| **State** | **Lives in the URL** — `?status=production&weaver=WV-001&from=2026-04-01` |
| Empty result | Phase 4's *filtered-empty* state, with a `Clear all filters` action |

URL-based filter state makes views bookmarkable and shareable, survives refresh, and makes browser back/forward work — and it's what dissolves `CustomersPage`'s 25 `useState` calls.

---

# PART K — THE DATE SYSTEM

The largest single gap. 14 native `type="date"` inputs, zero calendar UI, no presets, no financial-year support.

## K.1 Formats — one set, app-wide

| Context | Format | Example |
|---|---|---|
| Table cell / inline | `d MMM yyyy` | `12 Jun 2026` |
| Compact (dense table) | `dd/MM/yy` | `12/06/26` |
| With time | `d MMM, h:mm a` | `12 Jun, 2:30 PM` |
| Long (documents) | `d MMMM yyyy` | `12 June 2026` |
| Relative (<7 days) | relative | `2 days ago`, `Today`, `Yesterday` |
| Range | `d MMM – d MMM yyyy` | `1 Apr – 30 Jun 2026` |
| Range, same month | `d – d MMM yyyy` | `1 – 30 Jun 2026` |
| Month | `MMM yyyy` | `Jun 2026` |
| Financial year | `FY yyyy–yy` | `FY 2026–27` |
| Machine / export | ISO 8601 | `2026-06-12` |

**Never `MM/DD/YYYY`.** `06/12/2026` is ambiguous between Indian and US convention — always spell the month in UI. All dates use tabular figures so columns align.

## K.2 Calendar

Built on `react-day-picker` (already a dependency; `shared/ui/calendar.tsx` exists and is unused).

```
┌─────────────────────────────────────┐
│  ‹      June 2026 ▾           ›     │  header 44 · month/year opens a picker
├─────────────────────────────────────┤
│  M   T   W   T   F   S   S          │  overline 12/600 --text-tertiary
│                          1          │
│  2   3   4   5   6   7   8          │
│  9  10  11  12  13  14  15          │
├─────────────────────────────────────┤
│  Today                     [Clear]  │  footer
└─────────────────────────────────────┘
```

```
cell:          36×36, radius --radius-md, tabular figures, 44px hit area
week starts:   Monday (Indian business convention)
today:         2px --border-brand ring, no fill
selected:      --surface-brand / --text-on-brand
in-range:      --surface-brand-subtle, square edges; rounded at the ends only
hover:         --bk-neutral-50
outside month: --text-disabled
disabled:      --text-disabled, strikethrough, not focusable
weekend:       --text-secondary (differentiated, never hidden)
has-data dot:  3px --chart-1 under the number — e.g. days with dispatches
```

**Keyboard:** `←→` day · `↑↓` week · `PageUp/Down` month · `Shift+PageUp/Down` year · `Home`/`End` week bounds · `Enter` select · `Esc` close. `aria-live` announces the focused date on move.

## K.3 Month & year navigation

Clicking `June 2026 ▾` opens a two-pane picker in place — no nested popover:

```
┌──────────────────────┬──────────────┐
│ Jan  Feb  Mar        │  2024        │
│ Apr  May  Jun ●      │  2025        │
│ Jul  Aug  Sep        │  2026 ●      │
│ Oct  Nov  Dec        │  2027        │
└──────────────────────┴──────────────┘
```
Year list is scrollable, centred on the current year, bounded by `minDate`/`maxDate`. `MonthPicker` and `YearPicker` are also exported standalone for `DateFilterBar`'s `month` and `year` modes.

## K.4 DatePicker

```tsx
<Field label="Dispatch date">
  <DatePicker value={date} onChange={setDate} min={today} format="d MMM yyyy" />
</Field>
```
Trigger is a Phase 3 `Input` with a `Calendar` icon. **Typed entry is supported** — parses `12/6/26`, `12 Jun 2026`, `2026-06-12`, `today`, `tomorrow`, `+7d` — because typing beats clicking through a calendar for a known date. Invalid input shows a Field error, never silently reverts.

## K.5 DateRangePicker — with presets

```
┌──────────────────────┬────────────────────────────────┐
│ Today                │   ‹   June 2026    July 2026 › │
│ Yesterday            │   … two months side by side …  │
│ Last 7 days          │                                │
│ Last 30 days         │                                │
│ This month           ├────────────────────────────────┤
│ Last month           │ 1 Apr – 30 Jun 2026 (91 days)  │
│ This quarter         │           [Cancel]  [Apply]    │
│ ★ This financial year└────────────────────────────────┘
│ Last financial year  │
│ Custom…              │
└──────────────────────┘
```

**Financial year = 1 April – 31 March.** This is essential for an Indian business and completely absent today — every GST return, P&L and statement is scoped to it.

Rules: two months side by side on desktop, one on mobile; hovering a candidate end date previews the range; `from > to` auto-swaps rather than erroring; the day count is always displayed; presets are keyboard-navigable; `Apply` commits (no live filtering on every hover).

## K.6 Rebuilding `DateFilterBar`

Keep the architecture — `DateFilterState`, `matchesDateFilter`, the five modes, and every call site. Replace the surface:

| Element | From | To |
|---|---|---|
| Mode selector | inline buttons | `SegmentedControl` |
| `day` mode | `<input type="date">` | `DatePicker` |
| `range` mode | 2 × `<input type="date">` | `DateRangePicker` + presets |
| `month` mode | `<input type="month">` | `MonthPicker` |
| `year` mode | `<select>` | `YearPicker` |
| Local `DFB_T` / `DFB_F` | 23rd theme block, taupe | Phase 1 tokens |
| `fontSize: 12.5`, `height: 38` | off-scale, under target | `label-md` 13, height 40, 44px hit area |
| Active filter display | none | `Chip` — "1 Apr – 30 Jun 2026 ×" |

**The public API is unchanged**, so all ~42 call sites across Weavers, Batches, Goods Receipt, Material Issuance, External Purchases and Payments get the new UI with zero edits.

---

# PART L — TOAST & NOTIFICATIONS

## L.1 Toast

Sonner is already wired. Configure it properly and use it everywhere.

```tsx
<Toaster
  position="bottom-right"          // was top-right — collides with the topbar
  expand={false}
  visibleToasts={3}
  gap={8}
  duration={4000}
  closeButton
  toastOptions={{ classNames: { … } }}
/>
```

```
width:    380 (mobile: full − 32)
radius:   --radius-lg  12
shadow:   --shadow-lg
padding:  14px 16px
icon:     20, left, tone-coloured
title:    label-lg 14/600 --text-primary
desc:     body-sm 13 --text-secondary
action:   Button tertiary sm, right
close:    IconButton ghost sm
```

| Tone | Duration | Icon | Use |
|---|---|---|---|
| `success` | 4s | `CheckCircle2` `--text-success` | Saved, sent, recorded |
| `error` | **persistent** | `AlertCircle` `--text-danger` | Failed — must be dismissed |
| `warning` | 6s | `AlertTriangle` `--text-warning` | Partial success |
| `info` | 4s | `Info` `--text-info` | Background completion |
| `loading` | until resolved | `Spinner` | Long operation |

**Rules:**
- **Every mutation fires one.** Today: 12 calls. Target: every create / update / delete / send / generate.
- Undo where reversible: `toast.success('Saree archived', { action: { label: 'Undo', onClick } })` — 8s duration.
- `toast.promise()` for async: pending → success/error in one toast, no flicker.
- Never for validation errors — those belong inline on the `Field`.
- Deduplicate by `id`; stack max 3, then collapse to "+2 more".
- **`aria-live="polite"` for success/info, `assertive` for error** — currently unset, so all 12 existing toasts are silent to AT (WCAG 4.1.3).
- Bottom-right avoids covering the topbar and the sticky table header.

## L.2 Notification centre

The bell in the topbar (`showNotif`, 27 state references) becomes a `Popover`:

```
┌────────────────────────────────────┐
│ Notifications        Mark all read │
│ [All] [Unread] [Alerts]            │
├────────────────────────────────────┤
│ ● 🔴 Low stock — 12 sarees left    │
│      Just now                      │
│ ● 🟢 Ravi Kumar completed 3 sarees │
│      2h ago                        │
│   ⚪ 12 sarees cleared QC          │
│      Yesterday                     │
├────────────────────────────────────┤
│         View all notifications     │
└────────────────────────────────────┘
```
```
width 400 · max-height 480 · item 72 min · unread dot 6px --surface-brand
unread row --surface-brand-subtle · timestamp relative <7d then absolute
badge on the bell: count to 9, then "9+", aria-label "3 unread notifications"
```

---

# PART M — ALERT, BANNER & INLINE MESSAGE

Three levels, distinct from toast.

| Component | Scope | Dismissible | Example |
|---|---|---|---|
| **Banner** | App-wide, top of shell | Sometimes | "You are in Superadmin mode" |
| **Alert** | Section-level, in-page | Optional | "3 invoices are overdue" |
| **Inline** | Field-level | No | Field error (Phase 3) |

```
Alert:
  layout:     [icon 20] [title + body] [action] [× ]
  padding:    16
  radius:     --radius-md  8
  background: --surface-{tone}-subtle
  border:     1px --bk-{tone}-200
  border-inline-start: 3px --border-{tone}      ← the accent stripe
  title:      label-lg 14/600 --text-{tone}
  body:       body-sm 13 --text-secondary
  role:       "status" (info/success) · "alert" (warning/danger)
```

The existing superadmin banner (`SAOverviewPage.tsx:120`) already uses a 3px left border — that pattern is correct and becomes the standard. Its colour moves from `#C4923A` (2.55:1) to `--border-warning`, and its text from gold to `--text-warning` (5.95:1).

**Never colour alone:** icon + text always.

---

# PART N — CONFIRMATION PATTERNS

Three tiers by consequence.

### Tier 1 — Reversible → no confirmation
Archive, hide, mark read. **Act immediately, toast with Undo.** Confirmation dialogs on reversible actions train users to click through without reading.

### Tier 2 — Destructive but recoverable → confirm
```
┌──────────────────────────────────────┐
│  Delete saree SR-00142?              │  title-md
│                                      │
│  This removes it from inventory.     │  body-md --text-secondary
│  You can restore it within 30 days.  │
│                                      │
│              [Cancel]  [Delete]      │  Cancel = tertiary, FOCUSED
└──────────────────────────────────────┘  Delete = danger
```
Size `xs`. **Initial focus on Cancel.** The title names the specific record.

### Tier 3 — Irreversible → type to confirm
```
│  Type INV-2026-0142 to confirm       │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  └──────────────────────────────┘    │
│              [Cancel]  [Delete]      │  Delete disabled until it matches
```
For: voiding an invoice, deleting a weaver with history, purging a batch. The friction is the point.

**Unsaved changes** — on close, `Escape`, or navigation away from a dirty form:
```
│  Discard changes?                    │
│  Your edits to this batch won't be   │
│  saved.                              │
│         [Keep editing]  [Discard]    │
```
`Keep editing` is `tertiary` and focused; `Discard` is `danger-subtle`.

---

# PART O — NAVIGATION COMPONENTS

Implements the Phase 2 geometry and the 5-group IA.

## O.1 Topbar — 72px

```
[☰]  [logo] BEERE KESAVA        [🔍 Search ⌘K]        [+ New ▾] [🔔 3] [avatar ▾]
```
```
background: --surface-brand (--bk-burgundy-950 deep wine)
height:     var(--shell-topbar-h)     sticky top 0, z-nav
brand:      logo 40 + wordmark title-sm --text-on-brand
search:     Button, 320 wide, --text-on-brand @ 70%, opens the command palette
+ New:      DropdownMenu — the home for "Add New User" (removed from nav in Phase 2)
bell:       IconButton ghost + count badge → notification Popover
avatar:     Avatar sm + ChevronDown → DropdownMenu (Profile · Switch role · Settings · Log out)
mobile:     56px, [☰] [logo] [🔍] [🔔]
```

## O.2 Groupbar — 52px

```
Overview   Production   Inventory   Finance   Partners
──────────                                              ← 2px active indicator
```
```
background:   --surface-raised     border-bottom --border-default
item:         h 52, px 16, label-lg 14/500 --text-secondary
active:       --text-brand, 600, 2px --surface-brand bottom indicator
hover:        --bk-neutral-50
aria-current: "page"
5 groups fit at 1024px — no horizontal scroll needed (Phase 2, D.3)
```
Groups with >1 page open a `DropdownMenu` **on click** — replacing the `mouseenter` + 140ms timer.

## O.3 Sectionbar — 48px

Keep `SectionNavigator`'s scroll-spy logic; replace the geometry and styling.

```
Wholesale · Retail · Analytics · Inactive
```
```
sticky top:  var(--shell-chrome-h)     z-sticky
pill:        h 32, px 12, radius --radius-full, label-md 13
active:      --surface-brand-subtle / --text-brand, animated indicator (layoutId)
scroll-spy:  IntersectionObserver, rootMargin -{--scroll-margin-anchor}
```
**The runtime `findScrollContainer` DOM walk is deleted** — Phase 2 declares the document as the single scroll owner. And the `SUB_NAV_H` 60-vs-66 bug is gone because every offset derives from one token.

## O.4 Breadcrumbs

```
Partners  ›  Weavers  ›  Ravi Kumar
```
```
<nav aria-label="Breadcrumb"><ol>
type:      body-sm 13 · links --text-secondary · current --text-primary + aria-current="page"
separator: ChevronRight 14 --text-tertiary, aria-hidden
collapse:  >4 levels → Home › … › Parent › Current, with "…" as a Popover
mobile:    show only "‹ Parent"
```
Appears on every drill-down page — currently absent, which is why `NAV_GROUP_FALLBACK` exists to keep the group highlighted.

## O.5 Tabs

```
Overview   Order History   Payments   Profile
─────────
```
Radix Tabs. `underline` (page-level, default) and `pill` (in-card) variants. `h 40`, `label-lg`, 2px active indicator, `←→` roving focus, `aria-controls`/`aria-labelledby` wired, lazy panel mount, **tab state in the URL** (`?tab=payments`) so a tab is linkable.

## O.6 Mobile bottom nav — 64px

```
   ⌂        🏭        📦        ₹        👥
Overview  Production Inventory Finance Partners
```
```
fixed bottom, z-nav, padding-bottom env(safe-area-inset-bottom)
item: icon 20 + label-sm 12, min-height 44
active: --text-brand + filled icon variant
```
The `env(safe-area-inset-bottom)` is currently absent everywhere — the nav sits under the iPhone home indicator.

---

# PART P — IMPLEMENTATION PLAN

### Step 1 — Enforce the z-ladder *(2 hours, standalone win)*
```bash
rg -n "zIndex: (9999|99999|100000|9[0-9]{3}|[0-9]{4,})" frontend/src
```
Map every one of the 41 values onto the 10 tokens. The `9999+` cluster all become `--z-modal` or `--z-toast`. Do this first — it's mechanical and it fixes real stacking bugs.

### Step 2 — One scrim *(30 min)*
```bash
rg -n "rgba\(0, ?0, ?0, ?0\.[0-9]+\)" frontend/src
```
All ten opacities → `var(--surface-scrim)`.

### Step 3 — Build the overlay layer *(4–5 days)*
```
shared/ui/overlay/
  Modal.tsx  Drawer.tsx  Popover.tsx  DropdownMenu.tsx  ContextMenu.tsx
  CommandPalette.tsx  ConfirmDialog.tsx  useConfirm.ts  useUnsavedChanges.ts
shared/ui/feedback/
  Toast.ts  NotificationCenter.tsx  Alert.tsx  Banner.tsx
shared/ui/date/
  Calendar.tsx  DatePicker.tsx  DateRangePicker.tsx
  MonthPicker.tsx  YearPicker.tsx  presets.ts  format.ts
shared/ui/nav/
  Topbar.tsx  Groupbar.tsx  Sectionbar.tsx  Breadcrumbs.tsx
  Tabs.tsx  MobileNav.tsx
shared/ui/filter/
  FilterBar.tsx  FilterChip.tsx  useUrlFilters.ts
```
All Radix-backed. Build `Modal`, `DropdownMenu` and the date system first — they cover the most sites.

### Step 4 — Migrate modals *(2 weeks, incremental)*
```bash
rg -l 'position: "fixed"' frontend/src/features | wc -l   # 96
find frontend/src/features -iname "*modal*" | wc -l       # 63
```
Order: confirmations first (smallest, highest a11y payoff) → form modals → document previews. Each migration deletes an `AnimatePresence` block, a hand-rolled scrim, and a z-index literal.

### Step 5 — The date system *(3 days)*
```bash
rg -n 'type="date"|type="month"' frontend/src   # 14
```
Rebuild `DateFilterBar` internals against the unchanged public API — all ~42 call sites upgrade for free. Then replace the 14 native inputs.

### Step 6 — Toast coverage *(1 week, ongoing)*
```bash
rg -c "toast\." frontend/src/features   # 12
```
Audit every mutation handler. Target: every create/update/delete/send fires a toast. Add `toast.promise` for anything over ~400ms.

### Step 7 — Navigation *(3 days)*
Rebuild `TopNav` / `SATopNav` on the shell geometry and 5-group IA. Convert hover menus to `DropdownMenu`. Add breadcrumbs to every drill-down page.

### Step 8 — Enforce *(1 hour)*
```js
'no-restricted-syntax': [
  'error',
  { selector: 'Property[key.name="zIndex"][value.value>800]',
    message: 'Use the --z-* ladder from tokens.css.' },
  { selector: 'JSXAttribute[name.name="type"][value.value="date"]',
    message: 'Use <DatePicker> from shared/ui/date.' },
],
```

---

# PART Q — DEFINITION OF DONE

- [ ] Every overlay uses a Radix primitive from `shared/ui/overlay`
- [ ] `role="dialog"` + `aria-modal` on every modal — **from 0 to all**
- [ ] `Escape` closes every overlay — **from 0 to all**
- [ ] Focus trapped on open, restored to the trigger on close — **from 0 to all**
- [ ] Body scroll locked with scrollbar compensation on every modal
- [ ] `rg "zIndex: [0-9]{4,}"` → **0**; all z-values are `--z-*` tokens
- [ ] `rg "rgba\(0,0,0,0\."` → **0**; one scrim
- [ ] `rg 'type="date"'` → **0**
- [ ] `DateRangePicker` includes **This financial year** and **Last financial year**
- [ ] `DateFilterBar` public API unchanged; all ~42 call sites work untouched
- [ ] Every mutation handler fires a toast; `toast.` count ≥ 100
- [ ] `Toaster` has `aria-live` configured; position `bottom-right`
- [ ] Every dropdown trigger has `aria-expanded` + `aria-controls`
- [ ] Group nav opens on **click**, not hover
- [ ] Breadcrumbs on every drill-down page
- [ ] Command palette on `⌘K`
- [ ] Irreversible actions require typed confirmation
- [ ] Dirty forms prompt before discarding
- [ ] `env(safe-area-inset-bottom)` on the mobile nav
- [ ] Full keyboard pass: open modal → complete form → submit → dismiss toast, no mouse
- [ ] `npm run typecheck && npm run lint && npm run build` clean

---

# PART R — WHAT PHASE 5 DOES *NOT* DO

- ❌ Domain status taxonomy, entity-code formatting, ₹ lakh/crore rules — **Phase 6** (Phase 5 supplies the date formatters; Phase 6 supplies currency)
- ❌ Invoice / PO / quotation document layout — **Phase 7** (Phase 5 supplies the `xl` modal that previews them)
- ❌ Print styles for overlays — **Phase 7**
- ❌ Executing the 63-modal migration in full — **Phase 8** (Phase 5 defines the API and migrates the confirmations)
- ❌ Backend notification delivery — out of scope; Phase 5 defines the UI contract only

---

## What Phase 5 eliminates

| Before | After |
|---|---|
| 63 hand-rolled modals, **0** with `role="dialog"` | 1 `Modal`, ARIA-complete |
| **0** Escape handlers across all overlays | Universal |
| **0** focus traps; focus tabs behind the modal | Trapped + restored |
| 3 scroll locks / 63 modals | Universal, with scrollbar compensation |
| 41 z-index values, 0 → 100000 | 10 tokens |
| 10 scrim opacities, all pure black | 1 warm scrim + blur |
| 382 hand-tuned `AnimatePresence` blocks | 5 motion specs |
| 129 hand-managed dropdown `useState`s | `DropdownMenu` with roving focus |
| Hover menus with a 140ms timer | Click-triggered, touch-safe |
| 14 native `type="date"`, 4 browser renderings | 1 calendar, 1 format set |
| No date presets, no financial year | 8 presets incl. FY 2026–27 |
| 12 toast calls in the entire app | Every mutation, with Undo |
| Toasts silent to screen readers | `aria-live` configured |
| No breadcrumbs, no command palette | Both |
