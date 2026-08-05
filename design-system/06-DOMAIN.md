# BK LOOM DESIGN SYSTEM
# Phase 6 — Domain Patterns

**Scope:** Entity code system, status taxonomy, money & number formatting, quantity/weight units, domain entity cards, role-gated data surfaces, domain iconography.
**Depends on:** Phases 1–5.
**Blocks:** Phase 7 (documents).

---

# PART A — THE AUDIT

## A.1 🐛 The money formatter is wrong, and it's wrong in a financial system

`lib/formatters.ts` has a compact mode used for metric cards and charts:

```js
export function formatINR(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10_00_000) return `₹${(amount / 10_00_000).toFixed(2)}L`;
    if (amount >= 1_00_000)  return `₹${(amount / 1_00_000).toFixed(1)}L`;
    if (amount >= 1_000)     return `₹${(amount / 1_000).toFixed(1)}K`;
    return `₹${amount}`;
  }
  …
}
```

Actual output:

| Input | `formatINR(v, true)` | Correct | Problem |
|---|---|---|---|
| ₹50,000 | `₹50.0K` | `₹50.0K` | ✅ |
| ₹1,00,000 | `₹1.0L` | `₹1.0L` | ✅ |
| **₹9,99,999** | **`₹10.0L`** | `₹10.0L`* | ⚠️ rounds up a tier |
| **₹10,00,000** | **`₹1.00L`** | **`₹10.0L`** | ❌ **10× understated** |
| **₹50,00,000** | **`₹5.00L`** | **`₹50.0L`** | ❌ **10× understated** |
| **₹5,00,00,000** | **`₹50.00L`** | **`₹5.00Cr`** | ❌ **10× understated, no crore tier** |

### Three distinct defects

**1. The first branch divides by the wrong constant.**
`10_00_000` is JavaScript for `1000000`. The branch divides by 1,000,000 and labels the result `L` — but a lakh is 100,000. Everything at or above ten lakh is displayed at **one tenth of its true value**.

**2. The display is non-monotonic.**
```
₹9,99,999   →  ₹10.0L
₹10,00,000  →  ₹1.00L      ← the number went UP, the display went DOWN
```
A revenue metric card ticking past ten lakh visibly *drops* by 90%.

**3. There is no crore tier.**
₹5,00,00,000 renders as `₹50.00L` (already 10× wrong) instead of `₹5.00Cr`. For a wholesale silk business, crore-scale annual figures are routine.

## A.2 Two `formatINR` functions that disagree

```js
// lib/formatters.ts
new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits: 0 })

// features/payments/utils/format.ts
"₹" + n.toLocaleString("en-IN")
```

| Input | `lib` | `payments` |
|---|---|---|
| `1234.567` | `₹1,235` | `₹1,234.567` |

The payments module — the one place precision matters most — renders **three decimal places of rupees**. There is no such thing as 0.567 of a rupee.

Meanwhile the raw call sites:
```
toLocaleString("en-IN")   192
toLocaleString('en-IN')     1
toLocaleString()            2      ← locale-dependent; renders 1,00,000 as 100,000 in en-US
₹ literal                 624
raw / 100000 divisions     26
toFixed(0) 15 · toFixed(1) 28 · toFixed(2) 9 · toFixed(3) 10
```

**Four precisions, three formatters, 624 hand-placed rupee symbols, 26 hand-rolled lakh conversions.** And `lib/formatters.ts` — which is well-written apart from the compact bug — is barely adopted.

## A.3 52 status values, with case and word-order duplicates

```
"active" 59   "Active" 24            ← same state, two casings
"complete" 25 "completed" 14 "Completed" 1   ← same state, three spellings
"pending" 9   "Pending" 14
"overdue" 7   "Overdue" 11
"approved" 9  "Approved" 3
"inactive" 2  "Inactive" 2
"rejected" 1  "Rejected" 1
"Passed QC" 6 "QC Passed" 5          ← same state, two word orders
```

**52 distinct literals for what is structurally about 28 states.** Every equality check (`status === "active"`) silently misses the `"Active"` rows.

### And the field is overloaded

`status` is being used for at least five different concepts:

| Actual meaning | Values found |
|---|---|
| Lifecycle state | `pending`, `approved`, `complete`, `dispatched`, `returned` |
| **Entity type** | `retail`, `wholesale` | ← not a status |
| **Audit event** | `login`, `logout` | ← not a status |
| **Reconciliation result** | `Match`, `Short`, `Excess` | ← not a status |
| **Resource condition** | `idle`, `maintenance`, `available`, `reserved` |

`"login"` and `"wholesale"` are not statuses. They're in the status field because there was no other convention.

## A.4 Entity codes: 25 prefixes, inconsistent shapes

```
BKB   266     WV     229    BATCH  198    SB     79
GRN    65     PO      53    FL      53    INV    52
EXT    50     HZ      48    ORD     45    WHL    36
PS     23     BS      23    SUP     22    VEN    19
MIR    17     FA      17    PUR     16    EMP    14
VP     13     FR      12
```

Plus `RAVI` (61), `PADMA` (45), `SURESH` (14) — **weaver first names used as code prefixes**, which will collide the moment a second Ravi is onboarded.

### Invoice numbers have three incompatible shapes

```
INV-2026-001        prefix-year-serial
INV-999             prefix-serial          ← no year
INV-CS-2026-018     prefix-subtype-year-serial
```

Three formats for one document type. Sorting, searching and parsing all break across them.

### And they're rendered in mono 1,206 times

```bash
$ rg -c "fontFamily: F.mono" frontend/src/features
1206
```

**1,206 monospace applications.** Phase 1 scoped mono to entity codes only — but 1,206 is far more than the number of codes on screen. Mono is being applied to timestamps, quantities, currency, table headers (Phase 4 found 25), and labels. That volume is exactly why the font reads as harsh: it isn't an accent, it's the body face.

## A.5 What already works — preserve it

Two patterns are genuinely good and should be formalised rather than replaced:

**`MoneyAccess`** — a context that gates monetary values by role, so inventory pages can be shared verbatim between admin and shop staff without leaking cost prices:
```tsx
<MoneyAccessProvider allowed={role !== 'shop'}>
  <MoneyGate><Price value={x} /></MoneyGate>
```
This is the right architecture. Phase 6 extends it into a general permission-gated value system.

**`DateFilterBar`'s `matchesDateFilter`** — already handled in Phase 5.

## A.6 Summary

| | Have | Need |
|---|---|---|
| `formatINR` implementations | 2, disagreeing, 1 with a 10× bug | 1, tested |
| Compact money tiers | K, L (broken), no Cr | K, L, Cr, correct |
| Currency call sites | 624 `₹` + 195 `toLocaleString` | `<Money>` component |
| Decimal precision | 4 different | 1 rule per context |
| Status literals | 52 (≈28 real states) | Typed enums, 6 tones |
| Status concepts in one field | 5 | 5 separate typed fields |
| Entity code prefixes | 25 + 3 name-based | 1 registry |
| Invoice number formats | 3 | 1 |
| Mono applications | 1,206 | ~code cells only |

---

# PART B — PRINCIPLES

| # | Principle | Mechanism |
|---|---|---|
| **M1** | **Money is an integer.** | Store paise. Never float rupees. `1234.567` cannot exist. |
| **M2** | **One formatter, tested.** | `lib/money.ts` with a unit-test table covering every tier boundary. |
| **M3** | **Compact form is monotonic.** | Displayed value never decreases as the true value increases. |
| **M4** | **Status is a typed union, not a string.** | TypeScript makes `"Active"` a compile error where `"active"` is expected. |
| **M5** | **One field, one concept.** | `status`, `type`, `condition`, `event` are separate fields. |
| **M6** | **Codes are generated, never typed.** | One registry defines the shape; a formatter renders it; a parser validates it. |
| **M7** | **Mono marks a code, and nothing else.** | If it isn't a scannable identifier, it isn't mono. |
| **M8** | **Sensitive values are gated at the component.** | Extend `MoneyAccess` — permission is not a caller's responsibility. |

---

# PART C — THE ENTITY CODE SYSTEM

## C.1 The registry

One file defines every code in the business. Shape, label, icon, route and colour all derive from it.

```ts
export const ENTITY_CODES = {
  weaver:      { prefix: 'WV',    pattern: 'WV-000',           label: 'Weaver',          icon: Icons.weaver,  route: '/weavers/:code' },
  batch:       { prefix: 'BATCH', pattern: 'BATCH-000',        label: 'Batch',           icon: Icons.batch,   route: '/batches/:code' },
  saree:       { prefix: 'SR',    pattern: 'SR-00000',         label: 'Saree',           icon: Icons.saree,   route: '/inventory/:code' },
  design:      { prefix: 'DS',    pattern: 'DS-000',           label: 'Design',          icon: Icons.design },
  loom:        { prefix: 'FL',    pattern: 'FL-000',           label: 'Loom',            icon: Icons.loom },
  customer:    { prefix: 'CU',    pattern: 'CU-0000',          label: 'Customer',        icon: Icons.customer },
  supplier:    { prefix: 'SUP',   pattern: 'SUP-000',          label: 'Supplier',        icon: Icons.supplier },
  vendor:      { prefix: 'VEN',   pattern: 'VEN-000',          label: 'Vendor',          icon: Icons.vendor },
  employee:    { prefix: 'EMP',   pattern: 'EMP-000',          label: 'Employee',        icon: Icons.employee },

  // Documents — year-scoped, financial year (Apr–Mar)
  invoice:     { prefix: 'INV',   pattern: 'INV-FY-0000',      label: 'Invoice',         icon: Icons.invoice },
  quotation:   { prefix: 'QTN',   pattern: 'QTN-FY-0000',      label: 'Quotation',       icon: Icons.quotation },
  purchaseOrder:{prefix: 'PO',    pattern: 'PO-FY-0000',       label: 'Purchase Order',  icon: Icons.po },
  goodsReceipt:{ prefix: 'GRN',   pattern: 'GRN-FY-0000',      label: 'Goods Receipt',   icon: Icons.grn },
  challan:     { prefix: 'DC',    pattern: 'DC-FY-0000',       label: 'Delivery Challan',icon: Icons.challan },
  payment:     { prefix: 'PAY',   pattern: 'PAY-FY-0000',      label: 'Payment',         icon: Icons.payment },
  order:       { prefix: 'ORD',   pattern: 'ORD-FY-0000',      label: 'Order',           icon: Icons.order },
} as const;
```

## C.2 Format rules

| Rule | Spec | Fixes |
|---|---|---|
| **Uppercase alphabetic prefix** | `WV`, `BATCH`, `INV` | — |
| **Zero-padded serial**, fixed width | `WV-001` not `WV-1` | sorting |
| **Documents carry the financial year** | `INV-2627-0142` = FY 2026–27, invoice 142 | the 3-shape invoice problem |
| **Hyphen separator only** | never `/`, `_`, space | parsing |
| **No name-based prefixes** | `RAVI-…` → `WV-001` | collisions |
| **One shape per entity** | enforced by `pattern` | 3 invoice formats → 1 |

**Financial-year segment:** `2627` for 1 Apr 2026 – 31 Mar 2027. Four digits, unambiguous, sorts correctly, and matches how Indian accounting actually scopes documents.

## C.3 The `<EntityCode>` component

This is where mono finally belongs — and the only place it appears.

```tsx
<EntityCode type="weaver" value="WV-002" />
<EntityCode type="invoice" value="INV-2627-0142" link copyable />
```

```
font:        --font-code (IBM Plex Mono) 13px/500
             tabular figures, letter-spacing 0
colour:      --text-primary
background:  --surface-sunken          (a subtle chip ground)
padding:     2px 6px
radius:      --radius-xs  4
white-space: nowrap
```

| Prop | Behaviour |
|---|---|
| `link` | Renders as a link to `registry.route`, `--text-brand`, underline on hover |
| `copyable` | Click copies; a check icon confirms for 1.5s; toast "Copied INV-2627-0142" |
| `icon` | Prepends the entity icon at 12px, `--text-tertiary` |
| `truncate` | Long codes ellipsise from the middle: `INV-2627-…142`, full value in a tooltip |
| `size` | `sm` 12px · `md` 13px (default) |

**Accessible name** is `"{label} {value}"` → *"Invoice INV-2627-0142"* — a screen reader reading `INV-2627-0142` character-by-character is meaningless without the entity name.

## C.4 Bringing mono back to 1,206 → ~code cells

```bash
rg -c "fontFamily: F.mono" frontend/src/features     # 1206
```

Triage:

| Current mono usage | → |
|---|---|
| Entity codes | `<EntityCode>` — **stays mono** |
| Currency / amounts | `<Money>` — Inter + tabular figures |
| Quantities, weights | `<Quantity>` — Inter + tabular figures |
| Dates, timestamps | Phase 5 formatters — Inter + tabular figures |
| **Table headers (25)** | Phase 4 `overline` — Inter |
| Percentages, counts | Inter + tabular figures |
| Labels, captions | Inter |

**Tabular figures do the alignment job that mono was being used for**, without the harshness. `font-variant-numeric: tabular-nums` gives every digit identical advance width — columns align perfectly in Inter. Expected outcome: ~1,206 → under 150.

## C.5 Code generation & validation

```ts
nextCode('invoice', { fy: '2627', lastSerial: 141 })   // → 'INV-2627-0142'
parseCode('INV-2627-0142')  // → { type:'invoice', fy:'2627', serial:142, valid:true }
isValidCode('INV-999')      // → false — missing FY segment
```
`<CodeInput>` (Phase 3) takes `entityType` and applies the mask, uppercase, and live validation. Users never type a code freehand.

---

# PART D — THE STATUS TAXONOMY

## D.1 Split the overloaded field

The 52 literals separate into five typed fields:

```ts
type LifecycleStatus  = …   // where a thing is in its process
type EntityType       = 'retail' | 'wholesale'
type ResourceCondition= 'available' | 'reserved' | 'in-use' | 'idle' | 'maintenance'
type AuditEvent       = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'export'
type ReconResult      = 'match' | 'short' | 'excess'
```

`retail` / `wholesale` become a `type` field rendered as a `Tag`, not a `StatusPill`. `login` / `logout` move to the audit log's own column. `Match` / `Short` / `Excess` get their own reconciliation column with a distinct visual treatment.

## D.2 The lifecycle taxonomies

Every value is `kebab-case`, typed, and mapped to one of the six Phase 3 `StatusPill` tones.

### Production
| Status | Label | Tone | Icon |
|---|---|---|---|
| `draft` | Draft | `neutral` | `FileText` |
| `planned` | Planned | `neutral` | `Calendar` |
| `warping` | Warping | `info` | `Loader` |
| `weaving` | Weaving | `info` | `Loom` |
| `finishing` | Finishing | `info` | `Sparkles` |
| `qc-pending` | Pending QC | `warning` | `Clock` |
| `qc-passed` | QC Passed | `success` | `CheckCircle2` |
| `qc-failed` | QC Failed | `danger` | `XCircle` |
| `completed` | Completed | `success` | `CheckCircle2` |
| `on-hold` | On Hold | `warning` | `PauseCircle` |
| `cancelled` | Cancelled | `neutral` | `Ban` |

> `"Passed QC"` / `"QC Passed"` / `"Quality Check"` / `"Pending QC"` all collapse into `qc-passed` and `qc-pending`.

### Inventory
| Status | Label | Tone |
|---|---|---|
| `in-stock` | In Stock | `success` |
| `low-stock` | Low Stock | `warning` |
| `out-of-stock` | Out of Stock | `danger` |
| `reserved` | Reserved | `info` |
| `dispatched` | Dispatched | `info` |
| `sold` | Sold | `success` |
| `returned` | Returned | `warning` |
| `damaged` | Damaged | `danger` |

### Payment
| Status | Label | Tone |
|---|---|---|
| `unpaid` | Unpaid | `neutral` |
| `partial` | Partially Paid | `warning` |
| `paid` | Paid | `success` |
| `overdue` | Overdue | `danger` |
| `due-soon` | Due Soon | `warning` |
| `settled` | Settled | `success` |
| `refunded` | Refunded | `info` |
| `written-off` | Written Off | `neutral` |

### Document
| Status | Label | Tone |
|---|---|---|
| `draft` | Draft | `neutral` |
| `raised` | Raised | `info` |
| `sent` | Sent | `info` |
| `approved` | Approved | `success` |
| `rejected` | Rejected | `danger` |
| `signed` | Signed | `success` |
| `received` | Received | `success` |
| `void` | Void | `neutral` |

### Person / partner
| Status | Label | Tone |
|---|---|---|
| `active` | Active | `success` |
| `inactive` | Inactive | `neutral` |
| `at-risk` | At Risk | `warning` |
| `suspended` | Suspended | `danger` |
| `onboarding` | Onboarding | `info` |

**≈40 typed statuses across 5 taxonomies, mapped to 6 verified tones** — replacing 52 free-text strings.

## D.3 Rendering

```tsx
<StatusPill taxonomy="payment" status="overdue" />   // ● Overdue
```
The component resolves label, tone and icon from the registry. Callers never pass a colour. **Impossible to render `"Active"` and `"active"` differently, because the type won't allow both.**

## D.4 Status semantics

| Rule | Spec |
|---|---|
| **Dot + text, always** | Never colour alone (WCAG 1.4.1) |
| **One status per entity per taxonomy** | A saree has one inventory status and one production status — separate columns |
| **Terminal states are visually quieter** | `completed`, `settled`, `void` use `neutral` or muted `success` — the eye should go to what needs action |
| **`danger` means act now** | Reserve it for `overdue`, `qc-failed`, `out-of-stock`, `suspended` |
| **Transitions are validated** | `qc-pending → completed` without passing QC is rejected at the type level |
| **Sort order is lifecycle order**, not alphabetical | `draft → weaving → qc-pending → completed` |
| **Filters group by tone** | "Needs attention" selects every `danger` + `warning` status at once |

---

# PART E — THE MONEY SYSTEM

## E.1 Storage: integers in paise

```ts
type Paise = number & { readonly __brand: 'Paise' };

const rupees = (r: number): Paise => Math.round(r * 100) as Paise;
const toRupees = (p: Paise): number => p / 100;
```

Floating-point rupees produce `1234.567` and, worse, `0.1 + 0.2 = 0.30000000000000004` in totals. A branded `Paise` type makes it a compile error to pass a raw number where money is expected.

## E.2 The corrected formatter

```ts
const THOUSAND = 1_000;
const LAKH     = 1_00_000;      // 100,000
const CRORE    = 1_00_00_000;   // 10,000,000

export function formatMoney(paise: Paise, opts: MoneyOpts = {}): string {
  const rupees = paise / 100;
  const { compact = false, decimals, sign = false } = opts;

  if (compact) {
    const abs = Math.abs(rupees);
    let value: number, suffix: string;

    if      (abs >= CRORE)    { value = rupees / CRORE;    suffix = 'Cr'; }
    else if (abs >= LAKH)     { value = rupees / LAKH;     suffix = 'L';  }
    else if (abs >= THOUSAND) { value = rupees / THOUSAND; suffix = 'K';  }
    else                      { value = rupees;            suffix = '';   }

    // 2 significant decimals below 10, 1 above — keeps width stable and
    // guarantees monotonicity across tier boundaries.
    const d = Math.abs(value) < 10 ? 2 : 1;
    const shown = Number(value.toFixed(d));

    // Never let rounding push us into the next tier's territory.
    if (suffix && Math.abs(shown) >= 100) {
      return formatMoney(paise, { ...opts, compact: false });
    }
    return `₹${shown.toFixed(d)}${suffix}`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
    signDisplay: sign ? 'exceptZero' : 'auto',
  }).format(rupees);
}
```

### Verified against the failing cases

| Input | **Old (buggy)** | **New** |
|---|---|---|
| ₹999 | `₹999` | `₹999` |
| ₹50,000 | `₹50.0K` | `₹50.0K` |
| ₹1,00,000 | `₹1.0L` | `₹1.00L` |
| ₹9,99,999 | `₹10.0L` | `₹10.0L` |
| **₹10,00,000** | **`₹1.00L`** ❌ | **`₹10.0L`** ✅ |
| **₹50,00,000** | **`₹5.00L`** ❌ | **`₹50.0L`** ✅ |
| **₹5,00,00,000** | **`₹50.00L`** ❌ | **`₹5.00Cr`** ✅ |
| ₹1,234.567 | `₹1,235` / `₹1,234.567` | `₹1,235` (one answer) |

**Monotonic across every tier boundary**, which the old one was not.

## E.3 Precision by context — one rule each

| Context | Decimals | Example |
|---|---|---|
| Metric card, chart axis | compact | `₹12.4L` |
| Table cell, list | 0 | `₹8,400` |
| Invoice line item | **2** | `₹8,400.00` |
| Invoice total, tax | **2** | `₹9,912.00` |
| Rate per unit | 2 | `₹1,850.00 / kg` |
| Percentage | 1 | `18.0%` |

**Documents always show 2 decimals** — GST filings require paise-level precision. Screens show 0 because trailing `.00` on 40 table rows is pure noise.

## E.4 The `<Money>` component

Replaces 624 hand-placed `₹` and 195 raw `toLocaleString` calls.

```tsx
<Money value={paise} />                          // ₹8,400
<Money value={paise} compact />                  // ₹12.4L
<Money value={paise} decimals={2} />             // ₹8,400.00
<Money value={delta} sign colorBySign />         // +₹1,200  in --text-success
<Money value={cost} gate="cost" />               // ••••  for shop staff
```

```
font:      --font-ui (Inter), tabular figures — NOT mono
align:     end (inherits from ColumnDef type: 'currency')
negative:  −₹1,200 in --text-danger, minus sign not parentheses
zero:      ₹0 in --text-tertiary
null:      — in --text-tertiary
tooltip:   compact values show the exact figure on hover
```

`title` attribute carries the full value, so `₹12.4L` is always resolvable to `₹12,40,000`.

## E.5 Permission gating — extending `MoneyAccess`

Your existing `MoneyAccessProvider` / `MoneyGate` is the right idea. Phase 6 generalises it:

```tsx
<DataAccessProvider scopes={{ cost: false, sell: true, margin: false, payroll: false }}>
```
```tsx
<Money value={costPrice} gate="cost" />     // renders •••• for shop staff
<Money value={sellPrice} gate="sell" />     // renders normally
```

| Scope | Hidden from | Covers |
|---|---|---|
| `cost` | shop staff, weavers | buying price, supplier rates, margins |
| `sell` | weavers | selling price, invoice totals |
| `margin` | shop staff, weavers, workers | profit, markup % |
| `payroll` | everyone but admin/accountant | weaver payments, salaries |
| `customer-pii` | workers, weavers | phone, address, GSTIN |

Masked values render `••••` at the same width — so a shop-staff user sees the table structure without the figures, and no layout shifts between roles.

**Gating happens inside the component.** A caller cannot forget it, and a new page inherits the rules automatically.

---

# PART F — NUMBERS, QUANTITIES & UNITS

## F.1 `<Quantity>`

```tsx
<Quantity value={620} unit="g" />        // 620 g
<Quantity value={1240} unit="g" />       // 1.24 kg   (auto-promotes)
<Quantity value={18} unit="saree" />     // 18 sarees (pluralised)
<Quantity value={2.5} unit="m" />        // 2.5 m
```

| Unit | Base | Promotes at | Decimals |
|---|---|---|---|
| Weight | gram | 1,000 g → kg | 2 (kg), 0 (g) |
| Length | metre | 1,000 m → km | 1 |
| Count | piece | — | 0 |
| Yarn count | denier | — | 0 |

Always Inter + tabular figures. Unit is `--text-tertiary`, value is `--text-primary` — so the number reads first.

## F.2 Percentage

```tsx
<Percent value={72} />                  // 72.0%
<Percent value={14} delta />            // ↑ 14.0%  in --text-success
<Percent value={-3} delta invert />     // ↓ 3.0%   in --text-success (lower is better)
```
1 decimal by default. Deltas always carry an arrow — never colour alone (Phase 4, MetricCard).

## F.3 Universal number rules

| Rule | |
|---|---|
| **Indian grouping everywhere** | `10,00,000` not `1,000,000`. Explicit `en-IN`, never bare `toLocaleString()` |
| **Tabular figures on every number** | tables, cards, charts, documents |
| **Zero shows as `0`**, not blank | Blank means "unknown"; `0` means zero |
| **Unknown shows as `—`** | em dash, `--text-tertiary`, `aria-label="Not available"` |
| **Never abbreviate on documents** | Invoices show `₹12,40,000.00`, never `₹12.4L` |

---

# PART G — DOMAIN ENTITY CARDS

One card component per entity, driven by the registry so identity, status and code are always rendered identically.

## G.1 Shared anatomy

```
┌─────────────────────────────────────────┐
│  ┌────┐  Ravi Kumar            ● Active │  avatar · name (title-sm) · StatusPill
│  │ RK │  WV-001                         │  EntityCode
│  └────┘  Dharmavaram, AP                │  meta, body-sm --text-secondary
├─────────────────────────────────────────┤
│  Sarees      12    Looms       3        │  StatTile grid
│  Progress    68%   Batch    BATCH-079   │
├─────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░  68%                │  Progress
├─────────────────────────────────────────┤
│  [View profile]                    [⋯]  │  actions
└─────────────────────────────────────────┘
```
`--pad-card` 24 · `--radius-lg` 12 · `--shadow-sm` → `--shadow-md` on hover · `container-type: inline-size`.

## G.2 Per-entity contents

| Card | Identity | Primary metrics | Status | Progress |
|---|---|---|---|---|
| **Weaver** | avatar, name, `WV-`, village | sarees, looms, current batch | person | batch completion |
| **Customer** | avatar/initials, name, `CU-`, city | orders, outstanding, last order | person + payment | credit used |
| **Supplier** | logo/initials, name, `SUP-`, city | POs, spend, rating | person | — |
| **Vendor** | name, `VEN-`, service | jobs, outstanding | person + payment | — |
| **Saree** | image, design name, `SR-`, type | weight, price, weaver | inventory + production | — |
| **Batch** | `BATCH-`, design, weaver | sarees, days elapsed | production | completion |
| **Loom** | `FL-`, location, type | current batch, uptime | condition | batch completion |

## G.3 Avatar fallbacks — replacing the arbitrary set

Current: `bg: "#9B6B8A"`, `"#5A3E6B"`, `"#2D6B6B"`, `"#4A6B4A"` — hand-picked, unverified.

Replaced with 8 colours drawn from the Phase 1 ramps at the `-800` step, deterministic from a hash of the name, all ≥7:1 against white initials:

```
burgundy-800 #872D44 · blue-800 #045588 · teal-800 #015E5E · violet-800 #5F4080
green-800    #15603D · amber-800 #724701 · red-800  #8C2B26 · neutral-800 #322D28
```

## G.4 Density variants

| Variant | Height | Use |
|---|---|---|
| `card` | auto | grid views |
| `row` | 72 | list views |
| `compact` | 48 | pickers, dropdowns, search results |
| `inline` | 24 | `⬤ Ravi Kumar` inside a table cell |

`inline` is what renders in `ColumnDef` type `avatar` — avatar 20px + name + optional code.

---

# PART H — DOMAIN ICONOGRAPHY

Extends the Phase 3 registry with the 11 hand-rolled SVGs, rebuilt on Lucide's 24×24 / 2px-stroke grid so they sit correctly beside standard icons.

```ts
export const DomainIcons = {
  loom, warp, weft, saree, silkThread, jari, resham,
  dyeing, finishing, warehouse, qualityCheck,
} as const;
```

**Rules:** 24×24 viewBox, 2px stroke (1.5px at `xs`/`sm`), `currentColor` only, no fills, optically balanced against Lucide at the same size, and every one gets a semantic name in the registry — never imported directly.

Product photography (saree images) uses `<ImageWithFallback>` — which already exists in `shared/ui` and is one of the seven components actually adopted. Fallback is the design-name initials on the deterministic avatar colour.

---

# PART I — IMPLEMENTATION PLAN

### Step 1 — Fix the money bug *(2 hours — ship this today)*
This is a correctness defect in a financial system, not a design change.

```bash
rg -n "10_00_000|1_00_000" frontend/src/lib/formatters.ts
```
Replace `formatINR`'s compact branch with the Part E.2 implementation. Add the test table:

```ts
describe('formatMoney compact', () => {
  test.each([
    [999,        '₹999'],
    [50_000,     '₹50.0K'],
    [1_00_000,   '₹1.00L'],
    [9_99_999,   '₹10.0L'],
    [10_00_000,  '₹10.0L'],   // was ₹1.00L
    [50_00_000,  '₹50.0L'],   // was ₹5.00L
    [1_00_00_000,'₹1.00Cr'],  // was ₹10.00L
    [5_00_00_000,'₹5.00Cr'],  // was ₹50.00L
  ])('%i → %s', (paise, expected) => expect(formatMoney(rupees(paise), {compact:true})).toBe(expected));
});
```
Then delete `features/payments/utils/format.ts` and repoint its importers.

### Step 2 — Build the domain layer *(3–4 days)*
```
lib/domain/
  codes.ts        registry, nextCode, parseCode, isValidCode
  status.ts       5 taxonomies, tone map, transition rules
  money.ts        Paise type, formatMoney, arithmetic helpers
  units.ts        weight/length/count promotion
shared/ui/domain/
  EntityCode.tsx  Money.tsx  Quantity.tsx  Percent.tsx
  StatusPill.tsx  (extends Phase 3 with taxonomy resolution)
  WeaverCard.tsx  CustomerCard.tsx  SupplierCard.tsx
  VendorCard.tsx  SareeCard.tsx     BatchCard.tsx  LoomCard.tsx
  DataAccess.tsx  (generalises MoneyAccess)
```

### Step 3 — Normalise status values *(2 days)*
```bash
rg -o 'status: "[a-zA-Z ]*"' frontend/src/features | sort -u   # 52
```
Codemod the case and word-order duplicates first (`"Active"→"active"`, `"QC Passed"→"qc-passed"`), then split the overloaded values (`retail`/`wholesale` → `type`, `login`/`logout` → audit column). Typing the fields turns every remaining mismatch into a build error.

### Step 4 — Adopt `<Money>` *(1 week)*
```bash
rg -c "₹" frontend/src/features                    # 624
rg -c 'toLocaleString\("en-IN"\)' frontend/src     # 192
```
Start with tables (Phase 4's `type: 'currency'` already routes through the formatter), then metric cards, then forms.

### Step 5 — Reclaim the mono font *(3 days)*
```bash
rg -c "fontFamily: F.mono" frontend/src/features   # 1206
```
Triage per Part C.4. Every non-code usage becomes Inter + `tabular`. This is the change that makes the mono font read as premium instead of harsh — because it will finally be rare.

### Step 6 — Normalise entity codes *(2 days)*
```bash
rg -o '"INV-[0-9A-Za-z/-]*"' frontend/src | sort -u   # 3 shapes
rg -o '"(RAVI|PADMA|SURESH)-[^"]*"' frontend/src      # name-prefixed codes
```
Migrate to the registry shapes. Data migration is a backend concern; the frontend renders whatever it gets through `<EntityCode>`, which flags invalid shapes in dev.

### Step 7 — Enforce *(1 hour)*
```js
'no-restricted-syntax': [
  'error',
  { selector: 'Literal[value="₹"]',
    message: 'Use <Money> from shared/ui/domain.' },
  { selector: 'CallExpression[callee.property.name="toLocaleString"][arguments.length=0]',
    message: 'Bare toLocaleString() is locale-dependent. Use formatMoney or an en-IN formatter.' },
  { selector: 'Property[key.name="fontFamily"][value.property.name="mono"]',
    message: 'Mono is for entity codes only. Use <EntityCode>, or Inter + tabular figures.' },
],
```

---

# PART J — DEFINITION OF DONE

- [ ] `formatMoney` passes the full tier-boundary test table
- [ ] `₹10,00,000` renders `₹10.0L`, not `₹1.00L`
- [ ] `₹5,00,00,000` renders `₹5.00Cr`
- [ ] Compact output is **monotonic** — verified by a property test over 0…10⁹
- [ ] Exactly **one** `formatINR`/`formatMoney` in the codebase
- [ ] `features/payments/utils/format.ts` deleted
- [ ] Money is stored as branded `Paise`; no float rupee arithmetic
- [ ] `rg "₹"` in `features/` → **0** (all via `<Money>`)
- [ ] `rg "toLocaleString()"` with no locale → **0**
- [ ] `status` is a typed union in every model; 52 literals → ≈40 typed values
- [ ] `"Active"`, `"Completed"`, `"QC Passed"` are compile errors
- [ ] `retail`/`wholesale`, `login`/`logout`, `Match`/`Short`/`Excess` moved out of `status`
- [ ] `rg "fontFamily: F.mono"` reduced from **1,206** to under **150**
- [ ] One invoice number shape; `INV-999` and `INV-CS-…` migrated
- [ ] No name-prefixed codes (`RAVI-`, `PADMA-`, `SURESH-`)
- [ ] Every entity code renders via `<EntityCode>` with an accessible name
- [ ] `DataAccessProvider` gates `cost`, `sell`, `margin`, `payroll`, `customer-pii`
- [ ] Avatar fallback colours are the verified 8-colour set
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` clean

---

# PART K — WHAT PHASE 6 DOES *NOT* DO

- ❌ Invoice / quotation / PO document layout — **Phase 7** (Phase 6 supplies the codes, money precision and status pills they render)
- ❌ GST calculation logic — backend concern; Phase 6 defines the display contract only
- ❌ Print styles — **Phase 7**
- ❌ Backend code-generation or the data migration for existing records — Phase 6 defines the shapes; the migration is a backend task
- ❌ Executing the 624-site `<Money>` migration in full — **Phase 8** (Phase 6 defines the component and migrates tables)

---

## What Phase 6 eliminates

| Before | After |
|---|---|
| **₹10,00,000 displayed as ₹1.00L** (10× understated) | Correct, tested |
| **Display drops as the value rises** across the lakh boundary | Monotonic |
| **No crore tier** — ₹5Cr shown as ₹50L | `Cr` tier |
| 2 `formatINR`, one emitting `₹1,234.567` | 1 formatter, integer paise |
| 624 hand-placed `₹` + 195 `toLocaleString` | `<Money>` |
| 4 decimal precisions | 1 rule per context |
| 52 status literals; `active`/`Active`, `Passed QC`/`QC Passed` | ≈40 typed, 5 taxonomies, 6 tones |
| `status` holding 5 different concepts | 5 typed fields |
| 25 prefixes + name-based codes (`RAVI-…`) | 1 registry |
| 3 invoice number shapes | 1, financial-year scoped |
| **1,206 mono applications** | ~code cells only |
| Arbitrary avatar colours | 8 verified, deterministic |
| `MoneyAccess` for money only | `DataAccess` across 5 scopes |
