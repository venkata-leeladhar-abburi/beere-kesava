# BK LOOM DESIGN SYSTEM
# Phase 3 — Core Primitives

**Scope:** Button, Icon system, Input, Textarea, Select, Checkbox, Radio, Switch, Slider, Label, Field, Badge, Tag, Chip, Status pill, Avatar, Tooltip, Separator, Skeleton, Spinner.
**Depends on:** Phase 1 (tokens), Phase 2 (layout, targets, density).
**Blocks:** Phases 4–7.

---

# PART A — THE AUDIT

## A.1 The headline finding: `shared/ui/` is dead code

You have **56 shadcn/ui components** in `frontend/src/shared/ui/`. Checking what actually imports them from feature code:

```
Imports of shared/ui from features/ — the COMPLETE list:
  21×  shared/ui/DateFilterBar
  16×  shared/ui/DownloadAccess
  12×  shared/ui/DateFilterBar
   9×  shared/ui/SectionNavigator
   6×  shared/ui/DataPagination
   4×  shared/ui/ImageWithFallback
   2×  shared/ui/MoneyAccess
```

**Seven components. All seven are custom ones.** Not a single feature imports `button`, `input`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `badge`, `dialog`, `dropdown-menu`, `tooltip`, `popover`, `tabs`, `table`, `card`, `label`, `form`, `separator`, `skeleton`, `avatar`, `alert`, `progress`, `accordion`, `command`, `calendar`, `sheet`, `drawer`, `sonner`…

```bash
$ rg -l "shared/ui/button" frontend/src
# 0 results in features/

$ rg -l "import { Button }" frontend/src
shared/ui/sidebar.tsx      ← itself dead
shared/ui/carousel.tsx     ← itself dead
```

**`Button` is imported by exactly two files, both of which are themselves unused.** ~49 of 56 primitives are unreachable code that still ships in the bundle and still shows up in test coverage reports.

## A.2 What features build instead

| Element | Hand-built instances in `features/` |
|---|---|
| `<button>` | **752** |
| `<motion.button>` | **248** |
| **Total buttons** | **1,000** |
| `<input>` | **270** |
| `<select>` | **85** |

A representative sample — four buttons from one feature directory:

```jsx
/* inventory — "Close" */
style={{ width:"100%", height:46, background:G.button, color:"#FFFDF9",
         border:"none", borderRadius:12, fontSize:14, fontWeight:700 }}

/* inventory — "View" */
style={{ flex:1, height:40, background:"rgba(110,15,45,0.06)", color:T.royalBurgundy,
         border:"1px solid rgba(110,15,45,0.18)", borderRadius:10, fontSize:13, fontWeight:600 }}

/* inventory — "Print" */
style={{ flex:1, height:40, background:T.royalBurgundy, color:"#FFFDF9",
         border:"none", borderRadius:10, fontSize:13, fontWeight:600 }}

/* inventory — "Close" (again, different) */
style={{ flex:1, padding:"13px 0", borderRadius:11, fontSize:14, fontWeight:600,
         background:T.silkCream, color:T.taupe, border:"1.5px solid rgba(110,15,45,0.18)" }}
```

Four buttons, four heights (46 / 40 / 40 / ~44), four radii (12 / 10 / 10 / 11), three font sizes, three weights, and border widths of `none` / `1px` / `1.5px`. **All four are the same two semantic variants** — primary and secondary.

## A.3 The shadcn `Button` you have is wired to the wrong tokens

```js
default: "bg-primary text-primary-foreground hover:bg-primary/90"
```
`--primary` is `#030213` — near-black blue from the shadcn defaults. Even if features *did* import it, it would render off-brand. And `hover:bg-primary/90` is an **opacity trick**, not the Phase 1 state ladder (`burgundy-900 → 800 → 950`). Opacity hover lets the canvas bleed through, so the hover colour changes depending on what's behind the button.

Sizes are `h-9 / h-8 / h-10 / size-9` = **36 / 32 / 40 / 36px**. Three of those four are **below the 44px minimum target** from Phase 2.

## A.4 Accessibility: near-zero coverage

Across the entire `features/` directory:

```
aria-label       27
aria-expanded     0
aria-controls     0
aria-describedby  0
aria-invalid      0
aria-current      0
aria-live         0
aria-pressed      0
role              0
```

**27 ARIA attributes for 1,000 buttons and 355 form controls.**

| Issue | Count | WCAG |
|---|---|---|
| `placeholder=` used as the only label | ~223 placeholders vs 119 `htmlFor` → **~104 unlabelled inputs** | **3.3.2 fail** |
| Icon-only buttons without accessible names | most of the 27 `aria-label`s are here; the rest are unnamed | **4.1.2 fail** |
| Disabled state | only **54** `disabled={` for 1,000 buttons | — |
| Dropdown triggers without `aria-expanded` | all of them | **4.1.2 fail** |
| Invalid fields without `aria-invalid` / `aria-describedby` | all of them | **3.3.1 fail** |
| Toasts/alerts without `aria-live` | all of them | **4.1.3 fail** |
| `button:focus { outline: none }` globally | app-wide | **2.4.7 fail** *(Phase 1 fixed the CSS; Phase 3 fixes the components)* |

## A.5 Two icon libraries plus hand-rolled SVG

| Source | Files |
|---|---|
| `lucide-react` | **319** |
| `@phosphor-icons/react` | **36** |
| inline `<svg>` | 11 |

Both are full dependencies. Icons are mixed *within the same file* (`beere-dashboard/ui-icons.tsx` imports from both).

**14 distinct icon sizes:**
```
10 ×33   11 ×48   12 ×95   13 ×214   14 ×277   15 ×171   16 ×234
17 ×50   18 ×128  20 ×91   22 ×129   24 ×50    26 ×19    28 ×18
```
Sizes 13, 15, 17, 22 and 26 are off-grid and non-standard. Icons at 10–11px are below any usable threshold.

## A.6 Motion misuse

248 `<motion.button>` instances, essentially all with:
```jsx
whileHover={{ scale: 1.02 }}  whileTap={{ scale: 0.97 }}
```
Phase 1's motion rules say **buttons don't scale** — they change colour and shadow. Scaling a button:
- makes text reflow-blurry mid-animation (sub-pixel glyph rendering),
- moves the target *while the user is aiming at it* (a direct Fitts's Law violation),
- is why `motion.button` needed `button { background-color: rgba(0,0,0,0) }` injected globally — Motion was sampling `oklch()` backgrounds and crashing.

## A.7 Summary of the gap

| | Have | Need |
|---|---|---|
| Primitives actually used | 7 (all custom) | 18 |
| Buttons using a component | 0 | 1,000 |
| Semantic button variants | 0 defined | 7 |
| Documented states per component | 0 | 7 |
| Icon libraries | 2 + inline SVG | 1 |
| Icon sizes | 14 | 5 |
| ARIA attributes | 27 | ~2,000 |
| Targets ≥44px | rare | all |

---

# PART B — PRINCIPLES

| # | Principle | Mechanism |
|---|---|---|
| **P1** | **Semantics over appearance.** | `<Button intent="danger">`, never `<Button color="red">`. Intent survives rebranding. |
| **P2** | **Every state is specified, not emergent.** | 7 states × every component, defined before implementation. |
| **P3** | **Accessible by construction.** | A component that *can* be inaccessible is a broken component. `IconButton` requires `label`. TypeScript enforces it. |
| **P4** | **Composition over configuration.** | `<Field>` wraps any control. No `<Input label= error= hint= icon= …>` mega-props. |
| **P5** | **Uncontrolled by default, controlled when asked.** | Matches the platform, halves the state in feature code. |
| **P6** | **Motion serves feedback, never decoration.** | Colour + shadow. No scale on interactive targets. |
| **P7** | **One escape hatch, clearly marked.** | `className` passthrough + `cn()`. No `style` prop on primitives. |
| **P8** | **44px is a floor, not a target.** | Visual height may be 32px; hit area never is. |

---

# PART C — SHARED COMPONENT CONTRACT

Every primitive in Phase 3 conforms to this. It's what makes 18 components feel like one system.

## C.1 Universal props

```ts
interface PrimitiveProps {
  size?:     'sm' | 'md' | 'lg';        // md default
  intent?:   'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
  className?: string;                    // the ONLY escape hatch
  'data-testid'?: string;
}
```

**No `style` prop.** Primitives own their appearance. If you need something the variants don't cover, that's a missing variant — file it, don't inline it.

## C.2 Size scale — one set of numbers for every control

| Size | Height | Min target | Padding-x | Font | Icon | Radius |
|---|---|---|---|---|---|---|
| `sm` | 32 | **44** (via padding) | 12 | `label-md` 13 | 14 | `--radius-sm` 6 |
| `md` | 40 | **44** (via padding) | 16 | `label-lg` 14 | 16 | `--radius-md` 8 |
| `lg` | 48 | 48 ✓ | 20 | `body-lg` 16 | 20 | `--radius-md` 8 |

**The 44px floor without visual bloat:**
```css
.bk-control--sm { height: 32px; position: relative; }
.bk-control--sm::before {
  content: ''; position: absolute; inset: -6px 0;   /* 32 + 12 = 44 */
}
```
The control *looks* 32px; the *hit area* is 44px. Fitts's Law satisfied with no layout cost.

## C.3 The 7-state matrix — every interactive primitive

| State | Trigger | Visual delta | ARIA |
|---|---|---|---|
| **rest** | default | base tokens | — |
| **hover** | pointer over | bg −1 step, `--shadow-md` | — |
| **focus-visible** | keyboard | `--shadow-focus` (3px ring) | — |
| **active** | pressed | bg −2 steps, `--shadow-xs` | — |
| **disabled** | `disabled` | `--surface-disabled` / `--text-disabled`, `cursor: not-allowed`, no hover | `disabled` or `aria-disabled` |
| **loading** | `loading` | spinner replaces leading icon, label stays, pointer-events off | `aria-busy="true"` |
| **invalid** | `invalid` | `--border-danger`, danger ring | `aria-invalid="true"` + `aria-describedby` |

**`disabled` vs `aria-disabled`:** a truly unavailable action uses `disabled`. An action that's *temporarily* blocked but should stay focusable and explain itself (e.g. "Approve" pending a required field) uses `aria-disabled="true"` + a tooltip. Disabled buttons that vanish from the tab order are a common source of "I can't tell why this doesn't work."

## C.4 Ownership of Motion

Primitives use **CSS transitions**, not Motion. Motion is reserved for orchestrated entrances (Phase 5 overlays). This removes 248 `motion.button` instances, kills the `oklch()` sampling crash, and cuts the interaction latency of every button.

```css
.bk-control {
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color     var(--duration-fast) var(--ease-standard),
    color            var(--duration-fast) var(--ease-standard),
    box-shadow       var(--duration-fast) var(--ease-standard);
}
```

---

# PART D — BUTTON

## D.1 Variants — 7, semantic

| Variant | Rest | Hover | Active | Use | Max per view |
|---|---|---|---|---|---|
| **`primary`** | `surface-brand` / `text-on-brand`, `shadow-brand` | `burgundy-800` | `burgundy-950` | The one main action | **1 per view** |
| **`secondary`** | `surface-raised` / `text-brand`, `1px border-default` | `burgundy-50`, `border-brand` | `burgundy-100` | Supporting actions | unlimited |
| **`tertiary`** | transparent / `text-secondary` | `neutral-50` | `neutral-100` | Low-emphasis, toolbars | unlimited |
| **`ghost`** | transparent / `text-tertiary` | `neutral-50` | `neutral-100` | Icon-only, table row actions | unlimited |
| **`danger`** | `red-700` / white | `red-800` | `red-900` | Destructive confirm | 1 per dialog |
| **`danger-subtle`** | `red-50` / `red-700`, `1px red-200` | `red-100` | `red-200` | Destructive in a list | unlimited |
| **`link`** | transparent / `text-brand`, underline-offset 4 | underline | `burgundy-950` | Inline navigation | unlimited |

**Deliberately removed:** a "gold" or "accent" button. Per Phase 1's colour hierarchy, gold never carries text and never signals an action.

## D.2 Anatomy

```
┌─────────────────────────────────────┐
│  [icon]  Label  [icon]  [badge]     │   gap: var(--gap-inline)  8px
└─────────────────────────────────────┘
```

| Slot | Rule |
|---|---|
| Leading icon | Reinforces the verb (`Plus` for Add). Replaced by the spinner when `loading`. |
| Label | Sentence case. **Verb-first**: "Add customer", not "Customer". Never "OK"/"Submit" — say what happens. |
| Trailing icon | Only for disclosure (`ChevronDown`) or external (`ArrowUpRight`). Never decorative. |
| Count badge | Numeric only, e.g. `Filters (3)`. |

## D.3 API

```tsx
interface ButtonProps extends Omit<React.ComponentProps<'button'>, 'style'> {
  variant?: 'primary'|'secondary'|'tertiary'|'ghost'|'danger'|'danger-subtle'|'link';
  size?: 'sm'|'md'|'lg';
  iconLeft?:  LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  loadingLabel?: string;   // announced to screen readers, default "Loading"
  fullWidth?: boolean;
  asChild?: boolean;       // Radix Slot — for <Link>
}
```

**`loading` behaviour:** the label **stays visible** and the leading icon becomes a spinner. Replacing the label with a bare spinner destroys the button's accessible name mid-flight and causes a width jump. Width is locked with `min-width` at the moment loading starts.

## D.4 Implementation

```tsx
const button = cva(
  [
    'bk-control relative inline-flex items-center justify-center gap-2',
    'whitespace-nowrap select-none',
    'font-medium',
    'transition-[background-color,border-color,color,box-shadow]',
    'duration-[--duration-fast] ease-[--ease-standard]',
    'focus-visible:outline-none focus-visible:shadow-[--shadow-focus]',
    'disabled:pointer-events-none disabled:cursor-not-allowed',
    'disabled:bg-[--surface-disabled] disabled:text-[--text-disabled] disabled:shadow-none',
    'aria-busy:pointer-events-none',
    '[&_svg]:shrink-0 [&_svg]:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[--surface-brand] text-[--text-on-brand] shadow-[--shadow-brand]',
          'hover:bg-[--surface-brand-hover] hover:shadow-[--shadow-md]',
          'active:bg-[--surface-brand-active] active:shadow-[--shadow-xs]',
        ],
        secondary: [
          'bg-[--surface-raised] text-[--text-brand]',
          'border border-[--border-default]',
          'hover:bg-[--surface-brand-subtle] hover:border-[--border-brand]',
          'active:bg-[--bk-burgundy-100]',
        ],
        tertiary: [
          'bg-transparent text-[--text-secondary]',
          'hover:bg-[--bk-neutral-50] hover:text-[--text-primary]',
          'active:bg-[--bk-neutral-100]',
        ],
        ghost: [
          'bg-transparent text-[--text-tertiary]',
          'hover:bg-[--bk-neutral-50] hover:text-[--text-primary]',
          'active:bg-[--bk-neutral-100]',
        ],
        danger: [
          'bg-[--bk-red-700] text-white',
          'hover:bg-[--bk-red-800] active:bg-[--bk-red-900]',
          'focus-visible:shadow-[0_0_0_3px_rgba(203,75,67,0.40)]',
        ],
        'danger-subtle': [
          'bg-[--surface-danger-subtle] text-[--text-danger]',
          'border border-[--bk-red-200]',
          'hover:bg-[--bk-red-100] active:bg-[--bk-red-200]',
        ],
        link: [
          'bg-transparent text-[--text-brand] underline-offset-4 h-auto p-0',
          'hover:underline active:text-[--bk-burgundy-950]',
        ],
      },
      size: {
        sm: 'h-8  px-3  text-[13px] rounded-[--radius-sm] [&_svg]:size-3.5 before:absolute before:inset-y-[-6px] before:inset-x-0 before:content-[""]',
        md: 'h-10 px-4  text-[14px] rounded-[--radius-md] [&_svg]:size-4   before:absolute before:inset-y-[-2px] before:inset-x-0 before:content-[""]',
        lg: 'h-12 px-5  text-[16px] rounded-[--radius-md] [&_svg]:size-5',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  }
);
```

**Default is `secondary`, not `primary`.** With 1,000 buttons to migrate, a `primary` default would produce a page of competing calls-to-action. Primary must be opted into.

## D.5 Button groups & hierarchy

```
Order (LTR):  [tertiary/cancel]  [secondary]  [PRIMARY]
Gap:          var(--space-2)  (8px)
```

| Context | Composition |
|---|---|
| Page header | `secondary` × n + `primary` × 1 |
| Modal footer | `tertiary` "Cancel" + `primary`/`danger` confirm |
| Table row | `ghost` icon buttons, revealed on row hover *and* always present for keyboard |
| Toolbar | `tertiary` only, no primary |
| Empty state | `primary` × 1, `size="lg"` |
| Destructive dialog | `tertiary` "Cancel" (default focus) + `danger` confirm |

**Destructive dialogs put initial focus on Cancel**, not the destructive action.

## D.6 Migration mapping for the 1,000 existing buttons

| Current inline pattern | → |
|---|---|
| `background: G.button` / `T.royalBurgundy`, white text | `variant="primary"` |
| `background: "rgba(110,15,45,0.06)"`, burgundy text, burgundy border | `variant="secondary"` |
| `background: T.silkCream`, taupe text, border | `variant="tertiary"` |
| `background: "none"`, icon only | `<IconButton variant="ghost">` |
| `color: "#C0392B"` / `#C0392B` background | `variant="danger"` / `danger-subtle` |
| `borderRadius: "50%"`, 36×36, icon | `<IconButton shape="circle" size="sm">` |
| `whileHover={{scale:1.02}} whileTap={{scale:0.97}}` | **delete** — CSS handles it |
| `height: 46 / 44 / 40` | `size="md"` (40) |
| `height: 36` | `size="sm"` (32) |
| `padding: "13px 0"` + `flex:1` | `size="md" fullWidth` |

---

# PART E — ICON SYSTEM

## E.1 Standardise on Lucide; remove Phosphor

**Lucide is in 319 files, Phosphor in 36.** Lucide wins on volume, and its 24×24 / 2px-stroke geometry matches the system's line weights.

**Action:** map the 36 Phosphor usages to Lucide equivalents, then drop `@phosphor-icons/react` (~1.2MB installed). The 11 hand-rolled `<svg>` files stay only if they are genuinely domain-specific (loom, warp, saree) — those become a `bk-icons` set built on the same 24×24 grid.

## E.2 Size scale — 14 sizes → 5

| Token | px | Use | Replaces |
|---|---|---|---|
| `xs` | 12 | inside a badge, dense chip | 10, 11, 12 |
| `sm` | 14 | `sm` buttons, table cells, inline | 13, 14 |
| `md` | 16 | ★ default — `md` buttons, inputs, nav | 15, 16, 17 |
| `lg` | 20 | `lg` buttons, section headers | 18, 20, 22 |
| `xl` | 24 | empty states, feature icons | 24, 26, 28 |

**Sizes 10 and 11 are removed entirely** — below that, a 2px stroke aliases into mush.

## E.3 Rules

```tsx
// Decorative — adjacent to a text label
<Plus size={16} aria-hidden="true" />

// Meaningful — icon-only. NEVER without a name.
<IconButton icon={Trash2} label="Delete invoice" />
```

| Rule | Spec |
|---|---|
| Stroke width | `1.5` at xs/sm, `2` at md/lg/xl |
| Colour | `currentColor` — **never** a hardcoded hex. Icons inherit their context. |
| Alignment | `flex` + `shrink-0`. Never `vertical-align`. |
| Optical size | Icon ≈ 1.15× the adjacent text cap-height: 14px text → 16px icon |
| Decorative icons | `aria-hidden="true"` — always |
| Status icons | Paired with text or an accessible name. Never colour-only (WCAG 1.4.1) |

## E.4 Semantic icon registry

One name per concept, app-wide. Stops `Trash` / `Trash2` / `Delete` / `X` all meaning "remove".

```ts
export const Icons = {
  add: Plus,            edit: Pencil,        delete: Trash2,
  view: Eye,            download: Download,  upload: Upload,
  print: Printer,       search: Search,      filter: SlidersHorizontal,
  sort: ArrowUpDown,    close: X,            back: ArrowLeft,
  more: MoreHorizontal, expand: ChevronDown, external: ArrowUpRight,
  success: CheckCircle2, warning: AlertTriangle,
  error: AlertCircle,    info: Info,          pending: Clock,
  // domain
  weaver: Users,   loom: Factory,   saree: Shirt,
  batch: Layers,   invoice: FileText, payment: IndianRupee,
} as const;
```

---

# PART F — ICON BUTTON

The single biggest accessibility win available: most of the 1,000 buttons are icon-only.

```tsx
interface IconButtonProps {
  icon: LucideIcon;
  label: string;            // REQUIRED — becomes aria-label + tooltip
  variant?: 'primary'|'secondary'|'tertiary'|'ghost'|'danger';
  size?: 'sm'|'md'|'lg';
  shape?: 'square'|'circle';
  loading?: boolean;
  showTooltip?: boolean;    // default true
}
```

**`label` is a required prop.** TypeScript refuses to compile an unlabelled icon button. This converts a whole class of WCAG 4.1.2 failures into build errors.

| Size | Visual | Hit area | Icon |
|---|---|---|---|
| `sm` | 32×32 | 44×44 | 14 |
| `md` | 40×40 | 44×44 | 16 |
| `lg` | 48×48 | 48×48 | 20 |

```tsx
<button aria-label={label} className={…}>
  {loading ? <Spinner size={iconSize}/> : <Icon size={iconSize} aria-hidden="true"/>}
</button>
```
Tooltip is attached automatically (Part N) with `delayDuration: 500`.

---

# PART G — INPUT & TEXTAREA

## G.1 Anatomy

```
Label *                              ← Field, 14px/500, --text-primary
┌────────────────────────────────┐
│ [icon] value            [icon] │   ← Input, 40px
└────────────────────────────────┘
Helper text  ·or·  Error message     ← 12px, --text-tertiary / --text-danger
```

## G.2 States

| State | Border | Background | Ring | Text |
|---|---|---|---|---|
| rest | `--border-default` | `--surface-raised` | — | `--text-primary` |
| hover | `--border-strong` | `--surface-raised` | — | — |
| focus | `--border-focus` | `--surface-raised` | `--shadow-focus` | — |
| filled | `--border-default` | `--surface-raised` | — | `--text-primary` |
| invalid | `--border-danger` | `--surface-danger-subtle` | red 3px on focus | — |
| disabled | `--border-subtle` | `--surface-disabled` | — | `--text-disabled` |
| readonly | `--border-subtle` | `--surface-sunken` | — | `--text-secondary` |

**Placeholder is `--text-placeholder` (#A09A94, 2.78:1)** — deliberately low contrast, because it is *not* content. Which is exactly why it can never be the label.

## G.3 API

```tsx
interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'|'style'> {
  size?: 'sm'|'md'|'lg';
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  addonLeft?:  React.ReactNode;   // "₹", "WV-"
  addonRight?: React.ReactNode;   // "kg", "%"
  invalid?: boolean;
  clearable?: boolean;
}
```

## G.4 Specialised inputs

Each is a thin wrapper — same visual shell, correct semantics and formatting.

| Component | Behaviour |
|---|---|
| `<SearchInput>` | `type="search"`, `role="searchbox"`, search icon left, clear button right, **300ms debounce**, `⌘K` hint |
| `<CurrencyInput>` | `₹` addon, `inputMode="decimal"`, tabular figures, groups on blur (Indian lakh/crore), stores paise as integers |
| `<NumberInput>` | `inputMode="numeric"`, tabular figures, optional stepper, `↑/↓` keys |
| `<CodeInput>` | Phase 1 `code-md` font, `autocapitalize="characters"`, `spellcheck=false`, format mask (`WV-000`) |
| `<PhoneInput>` | `inputMode="tel"`, `+91` addon, 10-digit mask |
| `<PasswordInput>` | reveal toggle as `IconButton` with `aria-pressed` |

**Currency uses tabular figures and never a mono font** — per Phase 1, mono is for codes only.

## G.5 Textarea

Same shell. Adds:
```
min-height: 88px  (≈3 rows)
resize: vertical only
autosize: optional, max 12 rows then scrolls
counter: bottom-right when maxLength set — turns --text-warning at 90%, --text-danger at 100%
```

---

# PART H — SELECT

**85 raw `<select>` elements** exist today — unstyleable, no search, no multi-select, inconsistent across OSes.

Built on `@radix-ui/react-select` (already a dependency, currently unused).

## H.1 Trigger
Identical shell to Input, plus `ChevronDown` right (rotates 180° over `--duration-fast` on open).

## H.2 Menu
```
background:  --surface-overlay
border:      1px --border-default
radius:      --radius-lg          (12 — outer)
shadow:      --shadow-lg
padding:     var(--space-1)       (4)
max-height:  320px, then scrolls
z-index:     --z-dropdown         (300)
min-width:   trigger width
item:        h-40, px-12, radius --radius-sm (6 — inner = outer − padding)
             hover  --bk-neutral-50
             selected --surface-brand-subtle + Check icon right
```

## H.3 Variants

| Component | Adds |
|---|---|
| `<Select>` | single choice, ≤10 options |
| `<Combobox>` | **>10 options** — search field, `cmdk` (already a dep), fuzzy filter, "No results" |
| `<MultiSelect>` | checkbox items, selections render as removable chips in the trigger, "n selected" past 3 |
| `<SelectGroup>` | `<SelectLabel>` headers using Phase 1 `overline` |

**Rule (Hick's Law):** >10 options → `Combobox`. ≤2 options → `RadioGroup` or `Switch`, never a select.

## H.4 Keyboard
`Space`/`Enter`/`↓` open · `↑`/`↓` navigate · type-ahead jumps · `Home`/`End` · `Esc` closes and restores focus · `Tab` closes and commits.

---

# PART I — CHECKBOX / RADIO / SWITCH

## I.1 Choosing between them

| Control | When |
|---|---|
| **Checkbox** | Independent on/off; multi-select lists; "select all" |
| **Radio** | 2–5 mutually exclusive options, all visible |
| **Switch** | A **setting that applies immediately** — no Save button |
| **Select** | >5 mutually exclusive options |

Switch ≠ checkbox. If it needs a Save button, it's a checkbox.

## I.2 Specs

| | Checkbox | Radio | Switch |
|---|---|---|---|
| Size (md) | 18×18 | 18×18 | 36×20, thumb 16 |
| Radius | `--radius-xs` (4) | full | full |
| Unchecked | `2px --border-strong`, `--surface-raised` | same | track `--bk-neutral-300` |
| Checked | `--surface-brand` + white `Check` | `--surface-brand` + 8px white dot | track `--surface-brand`, thumb white |
| Hit area | 44×44 via label | 44×44 via label | 44×44 |
| Indeterminate | `Minus` icon, brand fill | — | — |
| Transition | `--duration-fast` | `--duration-fast` | thumb `transform` `--duration-normal` `--ease-emphasized` |

**The whole label is clickable** (`<label>` wrapping, or `htmlFor`). This is what turns an 18px box into a 44px target — and it fixes the ~104 unlabelled inputs at the same time.

**Switch never animates `left`** — only `transform: translateX()`. Per Phase 1 motion rules.

## I.3 Checkbox group / Radio group
```
gap:      var(--gap-stack)       12
label:    Phase 1 label-lg, --text-primary
desc:     Phase 1 caption, --text-tertiary, below the label
fieldset: <fieldset><legend> for grouped semantics
error:    applies to the group, aria-describedby on the fieldset
```

---

# PART J — SLIDER

Used for ranges (price filters, quality thresholds). Radix `Slider`.

```
track:        4px, --bk-neutral-200, radius full
range:        4px, --surface-brand
thumb:        20×20, --surface-raised, 2px --border-brand, --shadow-sm
              hit area 44×44 via ::before
              focus: --shadow-focus
              hover: scale 1.1  ← the ONE place scale is allowed
                                  (the thumb is a handle, not a target you aim at)
marks:        2px ticks, --border-strong
value label:  above thumb on drag, --surface-inverse, --radius-sm
```
Keyboard: `←/→` step · `↑/↓` step · `PageUp/Down` 10× · `Home`/`End`.
Always paired with a `NumberInput` for exact entry — sliders alone are imprecise for financial values.

---

# PART K — FIELD, LABEL & VALIDATION

`Field` is the composition wrapper that makes accessibility automatic. **This is the component that eliminates the ~104 placeholder-as-label failures.**

## K.1 API

```tsx
<Field
  label="Weaver code"
  required
  hint="Format: WV-000"
  error={errors.code?.message}
>
  <CodeInput placeholder="WV-001" {...register('code')} />
</Field>
```

`Field` generates the ids and wires them via context:
```
<label htmlFor={id}>                                   ← real label, always
<input id={id}
       aria-describedby={hintId + ' ' + errorId}
       aria-invalid={!!error}
       aria-required={required} />
<p id={hintId}>   hint
<p id={errorId} role="alert">  error
```

Feature code cannot forget these, because it never writes them.

## K.2 Anatomy

```
Weaver code *              ← label-lg 14/500 --text-primary; * is --text-danger
┌──────────────────────┐        (with sr-only "required")
│ WV-001               │
└──────────────────────┘
Format: WV-000             ← caption 12 --text-tertiary
⚠ Weaver code is required  ← caption 12 --text-danger + AlertCircle 12
```
Hint and error occupy the same row — **the row is always reserved** (`min-height: 20px`) so validation doesn't shift layout.

## K.3 Validation rules

| Rule | Spec |
|---|---|
| **When** | Validate on **blur**, re-validate on **change** once the field has errored |
| **Never** | Validate on first keystroke — it flags "j" while typing "john" |
| **Submit** | Focus the first invalid field, scroll it into view with `--scroll-margin-anchor` (Phase 2) |
| **Summary** | Forms with >6 fields get an error summary at the top, `role="alert"`, each item a link to its field |
| **Copy** | Say what to do, not what went wrong. "Enter a 10-digit mobile number" beats "Invalid input" |
| **Never colour-only** | Always icon + text alongside the red border (WCAG 1.4.1) |
| **Success state** | Only for async checks (e.g. "code available"). Never a green tick on every valid field. |

## K.4 Layout

```tsx
<FieldGroup columns={2}>   // .bk-layout-form from Phase 2 — auto-fit minmax(240px,1fr)
```
Vertical gap `--space-4` (16). Related fields group under a `<fieldset>` with an `overline` legend.

---

# PART L — BADGE, TAG, CHIP, STATUS

Four distinct components. Today they're all the same hand-rolled `<span>` with `padding: "2px 8px"` (×33) or `"3px 10px"` (×48).

| Component | Purpose | Interactive | Removable |
|---|---|---|---|
| **Badge** | Static count or label — `12`, `New` | ✗ | ✗ |
| **StatusPill** | Lifecycle state — `In Production` | ✗ | ✗ |
| **Tag** | Classification — `Silk`, `Pochampally` | ✗ | ✗ |
| **Chip** | Active filter — `City: Hyderabad ×` | ✓ | ✓ |

## L.1 Shared shell

```
height:     sm 20 · md 24
padding:    sm 2px 6px · md 2px 8px
radius:     --radius-sm (6) for badge/tag · --radius-full for status/chip
font:       Phase 1 label-sm — 12/500
icon:       12 (xs)
gap:        4
```
**24px is intentionally below 44px** — badges are not interactive. Chips *are*, so their remove button gets the 44px `::before` treatment.

## L.2 StatusPill — the domain-critical one

Uses the Phase 1 status triad (`-50` bg / `-200` border / `-700` text) and **always pairs a dot with text**, never colour alone.

```
●  In Production
↑  6px dot, --border-{tone}
```

| Tone | bg | border | text | Domain states (Phase 6 maps the full taxonomy) |
|---|---|---|---|---|
| `neutral` | `#F5F2EE` | `#D8D2CE` | `#4F4A45` | Draft, Archived |
| `info` | `#F1F8FE` | `#C5E3FD` | `#0A6AA7` | In Production, In Transit |
| `warning` | `#FEF6EC` | `#F6D9BA` | `#8D5802` | Pending QC, Due Soon |
| `success` | `#F0FAF4` | `#C9E8D4` | `#1F774E` | Completed, Paid, Passed |
| `danger` | `#FEF5F3` | `#FED3CD` | `#AB3832` | Overdue, Rejected, Cancelled |
| `brand` | `#FEF4F5` | `#FFD1D8` | `#6E0F2D` | Priority, Featured |

Every combination is AA-verified in Phase 1.

## L.3 Chip

```
[icon] Label × 
```
- `×` is a 16px `IconButton` with `aria-label="Remove {label}"` and a 44px hit area
- `Backspace`/`Delete` removes when the chip has focus
- Chip rows get a "Clear all" `tertiary` button past 3 chips

---

# PART M — AVATAR

```
sizes:     xs 24 · sm 32 · md 40 · lg 48 · xl 64 · 2xl 96
radius:    --radius-full
border:    2px --surface-raised (for stacked groups)
fallback:  initials, --font-ui 600, deterministic bg from a name hash
           over a fixed 8-colour set — all with ≥4.5:1 against white text
status dot: bottom-right, 25% of size, 2px --surface-raised ring
```

**Fallback colours must be from a verified set.** The current `data.tsx` uses `bg: "#9B6B8A"`, `"#5A3E6B"`, `"#2D6B6B"`, `"#4A6B4A"` — arbitrary. Phase 3 replaces these with 8 colours drawn from the Phase 1 ramps at the `-700` step, all ≥5:1 against white.

**`AvatarGroup`:** max 4 visible, `-8px` overlap, `+n` counter chip, `aria-label="{n} weavers"`.

**Every avatar image needs `alt`.** Decorative avatars beside a visible name get `alt=""`.

---

# PART N — TOOLTIP

Radix `Tooltip`.

```
background:   --surface-inverse   (#1D1814)
color:        --text-on-inverse
font:         caption 12
padding:      6px 10px
radius:       --radius-sm (6)
shadow:       --shadow-lg
max-width:    240px
z-index:      --z-tooltip (800)
delay:        500ms open · 0ms close (100ms within a group)
animation:    fade + 4px translate, --duration-fast --ease-decelerate
arrow:        6px
```

| Rule | Why |
|---|---|
| **Never** the only source of information | Not available on touch |
| **Never** contains interactive content | Use a Popover (Phase 5) |
| Icon-only buttons get one automatically | Supplements — does not replace — `aria-label` |
| Touch: long-press shows it | Or omit entirely |
| Dismissible with `Esc` | WCAG 1.4.13 |

---

# PART O — SEPARATOR

```
orientation: horizontal | vertical
colour:      --border-subtle (in-card) · --border-default (between regions)
thickness:   1px
inset:       none | --space-4 | --space-6
decorative:  role="none"  (default) — a divider is not a landmark
labelled:    <Separator label="or" />  — centred, caption, --text-tertiary
```
**Prefer spacing over rules.** Per Phase 2's Law of Proximity ladder, a 40px gap groups better than a 24px gap plus a line. Reach for a separator only when space alone is ambiguous.

---

# PART P — SKELETON & SPINNER

## P.1 Skeleton — the default loading state

```
background:  --bk-neutral-100
radius:      matches the content it replaces
animation:   shimmer, 1.6s --ease-standard infinite
             gradient neutral-100 → neutral-50 → neutral-100
reduced-motion: static --bk-neutral-100, no shimmer
```

**Skeletons must match the real layout.** A skeleton that doesn't match causes a jarring reflow — worse than a spinner. Ship `<TableSkeleton rows={n} cols={n}>`, `<CardSkeleton>`, `<MetricSkeleton>` so features can't get it wrong.

`aria-busy="true"` on the container; `aria-live="polite"` announces "Loading customers" once, not per row.

## P.2 Spinner

```
sizes:       sm 14 · md 16 · lg 20 · xl 32
stroke:      2px, --surface-brand (or currentColor inside a button)
track:       currentColor @ 20%
speed:       800ms linear infinite
reduced-motion: 2s, or swap for a pulsing dot
```

| Use | Component |
|---|---|
| Page / section load | **Skeleton** |
| Button action | Spinner **inside** the button, label retained |
| Inline async (e.g. code check) | `sm` spinner beside the field |
| Full-page route change | Skeleton shell, never a centred spinner |

`TabLoadingFallback.tsx` and `AccountantDashboard.tsx:26` currently hand-roll identical 32px spinners with `border: "3px solid rgba(139,26,46,0.15)"` — both become `<Spinner size="xl" />`.

## P.3 Progress
```
height:      sm 4 · md 6 · lg 8
track:       --bk-neutral-200
fill:        --surface-brand  (or intent colour)
radius:      --radius-full
transition:  width --duration-slow --ease-standard
label:       optional "72%" right, tabular figures
indeterminate: 40%-width sliding bar
aria:        role="progressbar" aria-valuenow/min/max
```
`ThreeCol.tsx` currently renders progress with three hardcoded colours (`#6B1A2A`, `#C4923A`, `#A0506A`). These become `intent="brand"`, and gold/mauve are dropped — per Phase 1, gold doesn't encode data.

---

# PART Q — FOCUS & KEYBOARD

## Q.1 Focus rules

```css
/* Phase 1 shipped the global rule; Phase 3 makes components honour it */
:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);   /* 3px rgba(166,58,85,.40) */
}
```

| Rule | Spec |
|---|---|
| `:focus-visible` only | No ring on mouse click |
| Ring contrast | `--border-focus` `#A63A55` at **6.25:1** — clears WCAG 1.4.11 |
| Never clipped | Focusable elements inside `overflow:hidden` need `outline-offset` or padding |
| Focus is never removed | Only restyled |
| Modal focus | Trapped, returns to the trigger on close (Phase 5) |
| Roving tabindex | Toolbars, radio groups, tab lists — one tab stop, arrows navigate |

## Q.2 Universal keyboard contract

| Key | Behaviour |
|---|---|
| `Tab` / `Shift+Tab` | Move between controls |
| `Enter` | Activate button / submit form |
| `Space` | Activate button, toggle checkbox/switch, open select |
| `Esc` | Close overlay, clear search input, cancel edit |
| `↑ ↓` | Navigate lists, menus, radio groups, number steppers |
| `← →` | Navigate tabs, slider, toolbar |
| `Home` / `End` | First / last item |
| Type-ahead | Jump in select, combobox, table |

---

# PART R — MOTION FOR PRIMITIVES

| Element | Property | Duration | Easing |
|---|---|---|---|
| Button colour / shadow | `background-color`, `box-shadow` | `--duration-fast` 150 | `--ease-standard` |
| Input border / ring | `border-color`, `box-shadow` | `--duration-fast` | `--ease-standard` |
| Checkbox / radio fill | `background-color`, `opacity` | `--duration-fast` | `--ease-standard` |
| Switch thumb | **`transform`** | `--duration-normal` 200 | `--ease-emphasized` |
| Select chevron | `transform: rotate` | `--duration-fast` | `--ease-standard` |
| Tooltip | `opacity` + `translateY(4px)` | `--duration-fast` | `--ease-decelerate` |
| Skeleton shimmer | `background-position` | 1600 | `--ease-standard` |
| Spinner | `transform: rotate` | 800 | `linear` |
| Progress fill | `width` | `--duration-slow` 300 | `--ease-standard` |

**Explicitly banned on primitives:** `scale` on buttons, links, chips, tabs, nav items — anything the user aims at. The only permitted `scale` is the slider **thumb** (a handle already under the cursor).

This removes all 248 `whileHover={{ scale: 1.02 }}` instances.

---

# PART S — IMPLEMENTATION PLAN

### Step 1 — Retire the dead shadcn primitives *(1 hour)*
```bash
rg -l "from ['\"].*shared/ui/(button|input|select|checkbox|badge|dialog|tooltip)" frontend/src
```
Confirm zero feature imports (it is zero today). Move the 49 unused files to `shared/ui/_legacy/` — don't delete yet; `sidebar.tsx` and `carousel.tsx` still reference `button`. Excluding `_legacy/` from the build immediately shrinks the bundle and cleans the coverage report.

### Step 2 — Build the primitive layer *(3–4 days)*
New directory, built on Phase 1 tokens:
```
shared/ui/primitives/
  Button.tsx  IconButton.tsx  Icon.tsx  icons.ts
  Input.tsx   Textarea.tsx    SearchInput.tsx  CurrencyInput.tsx
  NumberInput.tsx  CodeInput.tsx
  Select.tsx  Combobox.tsx    MultiSelect.tsx
  Checkbox.tsx Radio.tsx      Switch.tsx  Slider.tsx
  Field.tsx   Label.tsx
  Badge.tsx   StatusPill.tsx  Tag.tsx     Chip.tsx
  Avatar.tsx  Tooltip.tsx     Separator.tsx
  Skeleton.tsx Spinner.tsx    Progress.tsx
  index.ts
```
Build **Button, IconButton, Input, Field** first — they cover ~70% of all usage.

### Step 3 — Migrate one feature end-to-end *(1 day)*
Pick `features/inventory` — it has the four-button sample from A.2 and a representative mix. Migrating it proves the API before you commit to 1,000 call sites.

### Step 4 — Codemod-assisted button migration *(1–2 weeks, incremental)*
```bash
rg -c "<motion\.button" frontend/src/features   # 248
rg -c "<button"          frontend/src/features   # 752
```
Order by risk:
1. `motion.button` → `Button` (248) — mechanical; delete `whileHover`/`whileTap`
2. Icon-only `<button>` → `IconButton` (biggest a11y win; TS will demand `label`)
3. Remaining `<button>` by variant, feature by feature

### Step 5 — Form migration *(1 week)*
```bash
rg -c "<input"  frontend/src/features   # 270
rg -c "<select" frontend/src/features   #  85
```
Every `<input>` gets wrapped in `<Field>`. This is where the ~104 placeholder-as-label failures get fixed — and `Field` makes it impossible to reintroduce them.

### Step 6 — Icon consolidation *(4 hours)*
```bash
rg -l "@phosphor-icons" frontend/src   # 36 files
```
Map to Lucide, remove the dependency, snap all 14 icon sizes to the 5-token scale.

### Step 7 — Enforce *(2 hours)*
```js
// eslint.config.js
'no-restricted-syntax': [
  'error',
  { selector: 'JSXOpeningElement[name.name="button"]',
    message: 'Use <Button> or <IconButton> from shared/ui/primitives.' },
  { selector: 'JSXOpeningElement[name.name="input"]',
    message: 'Use <Input> wrapped in <Field>.' },
  { selector: 'JSXOpeningElement[name.name="select"]',
    message: 'Use <Select> or <Combobox>.' },
  { selector: 'JSXMemberExpression[object.name="motion"][property.name="button"]',
    message: 'Buttons use CSS transitions, not Motion. Use <Button>.' },
],
```
Add as `warn` first so the build stays green; flip to `error` per directory as each is migrated.

---

# PART T — DEFINITION OF DONE

- [ ] 18 primitives shipped from `shared/ui/primitives/`
- [ ] 49 unused shadcn files moved to `_legacy/` and excluded from the build
- [ ] `rg "<motion\.button" features` → **0**
- [ ] `rg "<button"  features` → **0**
- [ ] `rg "<input"   features` → **0**
- [ ] `rg "<select"  features` → **0**
- [ ] `@phosphor-icons/react` removed from `package.json`
- [ ] Every icon size is one of the 5 tokens
- [ ] `IconButton` cannot compile without `label`
- [ ] Every input is inside a `<Field>` with a real `<label htmlFor>`
- [ ] `aria-invalid` + `aria-describedby` on every validated field
- [ ] `aria-expanded` on every disclosure trigger
- [ ] Every interactive target ≥44×44 hit area
- [ ] No `scale` transform on any button, link, chip or tab
- [ ] Keyboard-only pass on one full form and one full table page
- [ ] `npm run typecheck && npm run lint && npm run build` clean

---

# PART U — WHAT PHASE 3 DOES *NOT* DO

- ❌ Table, DataGrid, MetricCard, charts — **Phase 4**
- ❌ Modal, Drawer, Popover, Dropdown menu, Toast, Command palette, Date picker — **Phase 5** (Phase 3 supplies the Button/Input they're built from)
- ❌ Domain status taxonomy — **Phase 6** (Phase 3 supplies `StatusPill`; Phase 6 maps your ~30 real states onto its 6 tones)
- ❌ Entity-code formatting and masks — **Phase 6** (Phase 3 supplies `CodeInput`)
- ❌ Print styles — **Phase 7**
- ❌ The full 1,000-site codemod execution — **Phase 8** (Phase 3 defines the mapping and migrates one feature as proof)

---

## What Phase 3 eliminates

| Before | After |
|---|---|
| 56 primitives, 49 unreachable | 18 primitives, all used |
| 1,000 hand-styled buttons | 1 `Button` + 1 `IconButton` |
| 4 heights / 4 radii / 3 weights for the same 2 variants | 3 sizes × 7 variants, tokenised |
| 270 `<input>` + 85 `<select>` | `Input` + `Select`/`Combobox`, all inside `Field` |
| ~104 inputs labelled only by placeholder | 0 — `Field` makes it impossible |
| 27 ARIA attributes total | Generated automatically by `Field`, `IconButton`, `Select` |
| 2 icon libraries, 14 sizes | 1 library, 5 sizes, semantic registry |
| 248 `motion.button` with scale-on-hover | CSS transitions, no scale |
| `hover:bg-primary/90` opacity trick | Explicit `900 → 800 → 950` state ladder |
| Buttons at 32/36/40px, mostly under target | 44px hit area guaranteed at every size |
