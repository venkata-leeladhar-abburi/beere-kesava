# BK LOOM DESIGN SYSTEM
# Phase 7 — Document System

**Scope:** Invoice, Quotation, Purchase Order, Delivery Challan, Payment Receipt, Statement of Account. Page geometry, print type scale, print colour, GST layout, line-item tables, multi-page rules, PDF generation, data export.
**Depends on:** Phases 1–6 (especially Phase 6: money precision, entity codes, status).
**Blocks:** nothing — this is the last design phase.

---

# PART A — THE AUDIT

## A.1 🐛 Printing an invoice prints the entire application

```bash
$ rg -c "window.print\(\)" frontend/src/features
6

$ rg -c "@media print" frontend/src
0
```

**Six print buttons. Zero print stylesheets.**

Call sites:
```
features/materials/components/modals/StockModals.tsx:320
features/materials/components/modals/WeaverModals.tsx:160
features/purchasing/components/PODocumentModal.tsx:290
features/purchasing/components/PODocumentModal.tsx:318
features/inventory/components/PurchaseModals.tsx:249
features/inventory/components/ExternalPurchasesPage.tsx:263
```

Every one of these calls `window.print()` on the live DOM with no print stylesheet. What actually reaches the paper:

| Printed | Should be |
|---|---|
| The 72px burgundy topbar, full-bleed | nothing |
| The group nav bar and section bar | nothing |
| The `rgba(29,24,20,0.48)` modal scrim — **a grey wash over the whole page** | nothing |
| The modal's rounded corners, shadow and close button | nothing |
| The page behind the modal, including the table the user came from | nothing |
| Screen colours — burgundy fills, cream backgrounds | black on white |
| Hover states frozen at whatever the cursor last touched | nothing |
| Links as coloured text with no URL | — |
| The document itself, squeezed into whatever width remains | full page |

`PurchaseModals.tsx:249` is `<motion.button onClick={() => window.print()}>` labelled **"Print GRN Receipt"**. It prints the app.

## A.2 There is no PDF generation

```bash
$ rg -n "jspdf|html2canvas|pdfmake|react-pdf|puppeteer" frontend/package.json
# no matches
```

No PDF library of any kind. So "download invoice" doesn't exist — the only path to a file is the browser's *Print → Save as PDF*, which produces the app screenshot described above.

For a business that sends invoices, quotations and purchase orders to customers and suppliers, **there is currently no way to produce a shareable document.**

## A.3 GST compliance is incomplete

```bash
$ rg -o "CGST|SGST|IGST|GSTIN|HSN" frontend/src/features | sort | uniq -c
   7 GSTIN
   0 CGST
   0 SGST
   0 IGST
   0 HSN
```

`InvoiceGenerator.tsx` computes tax as a single flat rate:
```js
const gstAmount  = data.applyGst ? subtotal * (parseFloat(data.gstPct) || 0) / 100 : 0;
const grandTotal = subtotal + gstAmount;
```

Missing from every document:

| Requirement | Status |
|---|---|
| **CGST + SGST split** (intra-state) | ❌ absent |
| **IGST** (inter-state) | ❌ absent |
| **HSN/SAC code** per line item | ❌ absent |
| **Place of supply** | ❌ absent |
| Rate-wise tax summary table | ❌ absent |
| Amount in words | ❌ absent |
| "Tax Invoice" title | ❌ absent |
| Reverse-charge declaration | ❌ absent |

Silk sarees are HSN **5007**; job-work services are SAC **9988**. Neither appears anywhere in the codebase. A GST invoice without HSN and without the CGST/SGST split is not a valid tax invoice.

## A.4 Money arithmetic on floats — in the invoice

```js
const subtotal   = sarees.reduce((sum, s) => sum + (parseFloat(data.prices[…]) || 0), 0);
const gstAmount  = subtotal * (parseFloat(data.gstPct) || 0) / 100;
const grandTotal = subtotal + gstAmount;
```

`parseFloat` on user-entered strings, accumulated with `+`, then multiplied by a percentage. This is exactly the failure mode Phase 6's branded `Paise` type exists to prevent. On an invoice with 18 line items, floating-point drift produces totals that don't reconcile to the sum of the lines — and the customer's accountant will find it.

## A.5 Documents are scattered with no shared layout

15 document-related files, none sharing a layout:

```
features/inventory/components/modals/shared/InvoiceGenerator.tsx   323 lines
features/purchasing/components/PODocumentModal.tsx                 351
features/inventory/components/modals/RaiseQuotationModal.tsx       183
features/payments/components/wholesale/ViewInvoiceModal.tsx        146
features/portals/components/worker/GRNSuccessPrint.tsx              75
features/inventory/components/sections/QuotationsSection.tsx
features/finishing/components/FinishingQuotationsSection.tsx
features/portals/components/worker/finishing/QuotationsSection.tsx  ← third quotation impl
… 7 more
```

**Three separate quotation implementations.** No shared letterhead, no shared party block, no shared totals block, no shared terms.

And `InvoiceGenerator` carries the same Phase 1 failures:
```js
fontSize: 11, fontFamily: F.mono, color: T.taupe   // 11px mono at 4.11:1
```

## A.6 What already works — preserve it

**`DownloadAccess`** — an existing context that lets the accountant *read* every figure but not export it:
```tsx
<DownloadAccessProvider allowed={false}>   // accountant portal
  <DownloadGate><Button>Export</Button></DownloadGate>
```
Correct architecture. Phase 7 extends it to cover print and PDF, not just file download.

**`xlsx`** is a dependency and used in 8 files — a working export path that just needs standardising.

## A.7 Summary

| | Have | Need |
|---|---|---|
| `@media print` rules | **0** | full stylesheet |
| `window.print()` behaviour | prints the whole app | prints the document |
| PDF library | **none** | 1 |
| Shared document layout | 0 (15 bespoke files) | 1 `DocumentPage` |
| Quotation implementations | 3 | 1 |
| CGST/SGST/IGST split | ❌ | ✅ |
| HSN/SAC codes | ❌ | ✅ |
| Amount in words | ❌ | ✅ |
| Money arithmetic | `parseFloat` + `+` | branded `Paise` integers |
| Print colour handling | screen colours | print colour set |

---

# PART B — PRINCIPLES

| # | Principle | Mechanism |
|---|---|---|
| **X1** | **A document is a document, not a screenshot.** | `DocumentPage` renders A4 geometry on screen and on paper. Print is not an afterthought. |
| **X2** | **Render once, output three ways.** | One React tree → screen preview, `@media print`, server PDF. No divergence possible. |
| **X3** | **Documents are legal records.** | GST-complete, immutable once issued, versioned, and they never abbreviate money. |
| **X4** | **Paper has no dark mode and no hover.** | A dedicated print colour set. Ink economy. Nothing interactive survives. |
| **X5** | **Money on documents is exact.** | Always 2 decimals, always from integer paise, always reconciling. |
| **X6** | **The brand appears once, at the top.** | Letterhead carries identity. The body carries information. |
| **X7** | **Export permission covers print, PDF and file.** | Extend `DownloadAccess` — "can't export" must mean "can't print to PDF" too. |

---

# PART C — DOCUMENT ARCHITECTURE

## C.1 One tree, three targets

```
                    ┌──────────────────────────┐
                    │   <InvoiceDocument       │
                    │      data={invoice} />   │
                    └────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
   SCREEN PREVIEW          PRINT (@media)          PDF (server)
   A4 page on a            same tree,              same tree,
   grey backdrop,          print stylesheet,       headless render,
   zoom + page nav         everything else         embedded fonts
                           display:none
```

The document component never knows which target it's in. Differences live entirely in CSS.

## C.2 Print isolation — the fix for A.1

```css
@media print {
  /* Everything is hidden by default … */
  body > * { display: none !important; }

  /* … except the document root, which is promoted to the page. */
  #document-print-root,
  #document-print-root * { display: revert !important; }

  #document-print-root {
    display: block !important;
    position: static !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    box-shadow: none !important;
    background: #FFFFFF !important;
  }

  /* Belt and braces for anything that escapes a portal */
  [data-print="hide"],
  .bk-shell__topbar, .bk-shell__groupbar, .bk-shell__footer,
  .bk-scrim, .bk-mobilenav, [role="tooltip"], [data-sonner-toaster] {
    display: none !important;
  }

  html, body {
    background: #FFFFFF !important;
    overflow: visible !important;
    height: auto !important;
  }
}
```

`#document-print-root` is a portal target in `index.html`, a sibling of `#root`. The document renders into it; `window.print()` then has exactly one thing to print.

## C.3 The print API

```tsx
const { print, download, email } = useDocument();

print(<InvoiceDocument data={invoice} />);
```

`useDocument` portals the tree into `#document-print-root`, waits for fonts and images (`document.fonts.ready` + image `decode()`), calls `window.print()`, and unmounts on `afterprint`. **The six raw `window.print()` calls are all replaced by this.**

Printing without waiting for `document.fonts.ready` is why print output sometimes falls back to Times New Roman — a real risk today.

---

# PART D — PAGE GEOMETRY

## D.1 A4

```css
@page {
  size: A4 portrait;          /* 210mm × 297mm */
  margin: 0;                  /* we control margins in the document */
}

.bk-doc {
  width:      210mm;
  min-height: 297mm;
  padding:    18mm 15mm 20mm 15mm;   /* top right bottom left */
  background: #FFFFFF;
  color:      var(--print-ink);
  box-sizing: border-box;
}
```

| Dimension | Value | Why |
|---|---|---|
| Page | 210 × 297 mm | A4 — the Indian standard |
| Side margins | **15mm** | Clears every consumer printer's unprintable edge (typically 5–10mm) |
| Top margin | **18mm** | Letterhead breathing room |
| Bottom margin | **20mm** | Reserves the footer and page numbers |
| **Content width** | **180mm** | 210 − 30 |
| Content height (p1) | 259mm | 297 − 18 − 20 |
| Continuation height | 247mm | after a 30mm running header |

**At 96 dpi:** 210mm = 793.7px, 180mm content = 680.3px. All internal measurements are in `mm` so they survive the browser's px→physical conversion exactly.

## D.2 Screen preview

```css
.bk-doc-viewport {
  background: var(--bk-neutral-200);   /* grey backdrop, like a PDF viewer */
  padding: var(--space-8);
  overflow: auto;
}
.bk-doc-viewport .bk-doc {
  box-shadow: var(--shadow-lg);
  margin-inline: auto;
  margin-block-end: var(--space-6);    /* gap between pages */
}
@media (max-width: 900px) {
  .bk-doc-viewport .bk-doc {
    transform: scale(var(--doc-zoom, 0.5));
    transform-origin: top center;
  }
}
```
Toolbar above the viewport: `[− 100% +] [◀ 1 / 2 ▶] [Print] [Download PDF] [Email]`. Renders inside the Phase 5 `xl` modal (1000px), or on its own route for a full-screen view.

---

# PART E — PRINT TYPE SCALE

Screen type is calibrated for 96dpi at ~60cm. Paper is ~300dpi at ~35cm. A separate scale is required — 14px body on paper reads oversized and wastes a third of the page.

| Token | Size (pt) | Line | Weight | Family | Use |
|---|---|---|---|---|---|
| `doc-brand` | **20pt** | 1.1 | 600 | Fraunces | Firm name in the letterhead |
| `doc-title` | **16pt** | 1.2 | 600 | Fraunces | "TAX INVOICE", "QUOTATION" |
| `doc-heading` | **10pt** | 1.3 | 600 | Inter | Section headings ("Bill To") |
| `doc-body` | **9pt** | 1.4 | 400 | Inter | ★ default document text |
| `doc-table` | **8.5pt** | 1.35 | 400 | Inter | Line-item rows |
| `doc-table-head` | **8pt** | 1.3 | 600 | Inter | Column headers, uppercase, `0.04em` |
| `doc-small` | **7.5pt** | 1.3 | 400 | Inter | Terms, footnotes, declarations |
| `doc-code` | **8.5pt** | 1.3 | 500 | IBM Plex Mono | Entity codes, HSN, GSTIN |
| `doc-total` | **11pt** | 1.2 | 600 | Inter | Grand total |
| `doc-amount-words` | 8.5pt | 1.4 | 500 | Inter | Amount in words |

**7.5pt is the floor.** Below that, thermal and inkjet printers lose strokes.

**Every numeric column uses tabular figures.** `font-variant-numeric: tabular-nums` — on paper this is what makes a 20-row amount column align to the decimal.

**Mono appears only in `doc-code`** — invoice numbers, HSN, GSTIN, entity codes. Amounts use Inter with tabular figures, per Phase 6.

---

# PART F — PRINT COLOUR

## F.1 The print palette

```css
@media print {
  :root {
    --print-ink:        #000000;   /* body text — true black, maximum legibility */
    --print-ink-muted:  #4A4A4A;   /* labels, secondary — 8.9:1 on white */
    --print-ink-faint:  #767676;   /* terms, footnotes — 4.7:1, the floor */
    --print-rule:       #B0B0B0;   /* table borders */
    --print-rule-light: #DCDCDC;   /* row separators */
    --print-fill:       #F2F2F2;   /* table header ground, totals band */
    --print-brand:      #6E0F2D;   /* letterhead + document title ONLY */
    --print-accent:     #8A6D2F;   /* the gold rule under the letterhead ONLY */
  }
}
```

## F.2 Rules

| Rule | Reason |
|---|---|
| **Body text is `#000000`** | `--text-primary` `#1D1814` is correct on screen; on paper, true black is sharper and prints cleanly on every device |
| **Brand colour appears twice, maximum** | Firm name and document title. Nothing else. |
| **No large colour fills** | Ink cost, and a burgundy band reproduces as muddy brown on most office printers |
| **Gold never carries text on paper** | `#C89B47` at 2.55:1 is unreadable in ink; it exists only as a 1pt rule under the letterhead |
| **StatusPills become outlined text** | `● Paid` → `PAID` in an outlined box, `--print-ink` on white |
| **`print-color-adjust: exact`** on tinted bands | Otherwise browsers strip backgrounds and the totals band vanishes |
| **Faint ink floor is `#767676`** (4.7:1) | Anything lighter disappears in photocopying — and these documents get photocopied |

```css
@media print {
  .bk-doc__totals, .bk-doc__table thead {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

## F.3 Greyscale and photocopy safety

Documents must survive a black-and-white photocopy. Therefore:
- Status is text in a box, never a coloured dot
- Table headers are distinguished by a `--print-fill` ground **and** rules, not colour
- Totals are distinguished by weight and a top rule, not colour
- The one 1pt gold rule is decorative — nothing depends on seeing it

---

# PART G — SHARED DOCUMENT ANATOMY

Every document is composed of the same nine blocks. `DocumentPage` supplies them; the six document types configure them.

```
┌────────────────────────────────────────────────────────────┐
│  ◆ BEERE KESAVA & BROTHERS              TAX INVOICE        │ ① Letterhead
│    Silk Sarees · Manufacturers                             │
│    12 Weavers Colony, Dharmavaram, AP 515671               │
│    GSTIN 37AABCB1234C1Z5 · +91 98490 12345                 │
│  ──────────────────────────────────────────────────────────│ ② Gold rule 1pt
│                                                            │
│  BILL TO                          INVOICE NO   INV-2627-0142│ ③ Parties + meta
│  Sri Silks & Sarees               DATE         12 Jun 2026 │
│  45 Commercial St, Hyderabad      DUE DATE     12 Jul 2026 │
│  GSTIN 36AACCS5678D1ZK            ORDER REF    ORD-2627-018│
│  Place of supply: Telangana (36)  BATCH        BATCH-086   │
│                                                            │
│  SHIP TO                                                   │
│  Same as billing                                           │
├────────────────────────────────────────────────────────────┤
│ # │ DESCRIPTION      │ HSN │ QTY │  RATE  │ AMOUNT         │ ④ Line items
│ 1 │ Kanchipuram Silk │5007 │  12 │8,400.00│ 1,00,800.00    │
│   │ SR-00142…SR-00153│     │     │        │                │
├────────────────────────────────────────────────────────────┤
│                            Taxable value      1,00,800.00  │ ⑤ Totals
│                            CGST @ 2.5%            2,520.00 │
│                            SGST @ 2.5%            2,520.00 │
│                            ─────────────────────────────── │
│                            TOTAL              ₹1,05,840.00 │
├────────────────────────────────────────────────────────────┤
│  HSN    TAXABLE      CGST         SGST        TOTAL TAX    │ ⑥ Tax summary
│  5007   1,00,800.00  2.5% 2,520   2.5% 2,520     5,040.00  │
├────────────────────────────────────────────────────────────┤
│  Amount in words: Rupees One Lakh Five Thousand Eight       │ ⑦ Amount in words
│  Hundred Forty Only                                        │
├────────────────────────────────────────────────────────────┤
│  BANK DETAILS                    TERMS & CONDITIONS        │ ⑧ Bank + terms
│  A/c 1234567890                  1. Payment within 30 days │
│  IFSC SBIN0001234                2. Goods once sold…       │
├────────────────────────────────────────────────────────────┤
│                                  For Beere Kesava & Bros   │ ⑨ Signature
│                                                            │
│                                  ─────────────────────     │
│  Computer-generated document      Authorised Signatory     │
│                                                    1 of 1  │
└────────────────────────────────────────────────────────────┘
```

## G.1 Block specifications

### ① Letterhead
```
height:   32mm
logo:     18mm square, left
firm:     doc-brand 20pt Fraunces 600, --print-brand
tagline:  doc-small 7.5pt, --print-ink-muted
address:  doc-small, 3 lines max
GSTIN:    doc-code 8.5pt mono
title:    doc-title 16pt Fraunces 600, --print-brand, right-aligned, uppercase
```
Firm data comes from `FirmsContext` — the app is multi-firm, so the letterhead is per-firm, not hardcoded.

### ② Rule
1pt `--print-accent`, full content width, 4mm below the letterhead. **The only gold on the page.**

### ③ Parties & metadata
Two-column, 50/50, 6mm gap.
```
label:  doc-table-head 8pt uppercase --print-ink-muted, 0.04em
value:  doc-body 9pt --print-ink
codes:  doc-code 8.5pt mono
meta:   right column, label/value pairs, values right-aligned
```
"Place of supply" is mandatory and drives CGST/SGST vs IGST (Part I).

### ⑤ Totals
Right-aligned, 70mm wide, 10mm from the line-item table.
```
row:        doc-body 9pt · label left · amount right · tabular figures
grand total:doc-total 11pt 600 · 0.5pt rule above · --print-fill band · 8mm tall
```

### ⑨ Signature
```
height:   28mm, bottom-right
"For {Firm Name}"  doc-body
seal:     optional PNG, 25mm, 40% opacity, behind the signature line
line:     0.5pt --print-rule, 50mm
caption:  "Authorised Signatory", doc-small
```
Left side carries the declaration: *"This is a computer-generated document."*

---

# PART H — THE SIX DOCUMENTS

## H.1 Tax Invoice — `INV-2627-0142`

| Aspect | Spec |
|---|---|
| Title | **TAX INVOICE** (mandatory wording under GST) |
| Copies | ORIGINAL FOR RECIPIENT · DUPLICATE FOR TRANSPORTER · TRIPLICATE FOR SUPPLIER — printed top-right in `doc-small` |
| Line item | #, Description, HSN, Qty, Rate, Discount, Taxable, Amount |
| Sub-line | Saree code range in `doc-code`, e.g. `SR-00142 – SR-00153` |
| Tax | CGST+SGST or IGST per Part I |
| Extras | Transport: LR number, vehicle, transporter; e-way bill number if > ₹50,000 |
| Terms | Payment due, interest on late payment, jurisdiction |
| Status | `PAID` / `PARTIALLY PAID` stamp, outlined, 40° rotated, `--print-ink-faint` |

## H.2 Quotation — `QTN-2627-0089`

Replaces **three** current implementations.

| Aspect | Spec |
|---|---|
| Title | **QUOTATION** |
| Meta | Quotation no, date, **valid until** (prominent), enquiry ref |
| Line item | #, Description, HSN, Qty, Rate, Amount — no tax split, one "Est. GST @ x%" line |
| Extras | Lead time, MOQ, sample availability |
| Terms | Validity, price-revision clause, payment terms, delivery terms |
| Footer | **"This is a quotation, not a tax invoice."** |
| Acceptance | "Accepted by ____ Date ____" block, bottom-left |

## H.3 Purchase Order — `PO-2627-0031`

| Aspect | Spec |
|---|---|
| Title | **PURCHASE ORDER** |
| Parties | **Reversed** — the firm is the buyer; the supplier is the addressee |
| Meta | PO no, date, required-by date, supplier ref, delivery address |
| Line item | #, Material, HSN, Qty, Unit, Rate, Amount |
| Extras | Delivery schedule, quality specification, packing instructions |
| Terms | Acceptance conditions, rejection rights, payment terms |
| Signature | Two blocks — **Prepared by** and **Approved by** |

## H.4 Delivery Challan — `DC-2627-0214`

| Aspect | Spec |
|---|---|
| Title | **DELIVERY CHALLAN** |
| Purpose | Goods movement without a sale (job work, sample, transfer) |
| Line item | #, Description, HSN, Qty, **Value for transport purposes only** |
| Extras | Reason for transport, vehicle no, LR no, e-way bill no |
| Footer | **"Not a tax invoice. Goods sent for {reason}."** |
| Signature | Receiver acknowledgement block with name, date and time |

## H.5 Payment Receipt — `PAY-2627-0567`

| Aspect | Spec |
|---|---|
| Title | **RECEIPT** |
| Size | **A5 landscape** (210 × 148mm) — receipts don't need A4 |
| Content | Received from, amount (figures + words), mode, reference, against invoice(s) |
| Extras | Balance outstanding after this payment |
| Signature | Received by |

## H.6 Statement of Account

| Aspect | Spec |
|---|---|
| Title | **STATEMENT OF ACCOUNT** |
| Period | Date range, defaulting to the **financial year** (Phase 5 presets) |
| Layout | Ledger — Date, Particulars, Ref, Debit, Credit, Balance |
| Opening | Opening balance row, then transactions, then closing balance |
| Ageing | Summary: Current / 0–30 / 31–60 / 61–90 / 90+ days |
| Multi-page | Balance carried forward / brought forward on every break |

---

# PART I — GST COMPLIANCE

The largest functional gap. Currently a single flat `gstPct`.

## I.1 Intra-state vs inter-state

The split is determined by comparing the **first two digits of the GSTIN** (the state code) of the supplier and the place of supply:

```ts
function taxSplit(supplierGstin: string, placeOfSupplyCode: string) {
  const supplierState = supplierGstin.slice(0, 2);
  return supplierState === placeOfSupplyCode ? 'intra' : 'inter';
}
```

| Case | Tax lines |
|---|---|
| **Intra-state** (AP → AP, code 37 → 37) | `CGST @ 2.5%` + `SGST @ 2.5%` |
| **Inter-state** (AP → Telangana, 37 → 36) | `IGST @ 5%` |

Silk sarees (HSN 5007) attract **5% GST**. Job-work services (SAC 9988) attract **5%**. The system stores the rate per HSN, not per document.

## I.2 HSN / SAC

| Code | Description | Rate |
|---|---|---|
| **5007** | Woven fabrics of silk / silk waste — sarees | 5% |
| **5004–5006** | Silk yarn, thread | 5% |
| **5605** | Metallised yarn — jari / zari | 12% |
| **9988** | Job work — manufacturing services on inputs owned by others | 5% |
| **9965** | Goods transport | 5% |

HSN is mandatory on every line item. The registry is a config table so rate changes are a data edit, not a code change.

## I.3 Rate-wise tax summary (block ⑥)

Mandatory when a document contains more than one tax rate:

```
┌──────┬──────────────┬──────────────┬──────────────┬───────────┐
│ HSN  │ TAXABLE      │ CGST         │ SGST         │ TOTAL TAX │
├──────┼──────────────┼──────────────┼──────────────┼───────────┤
│ 5007 │ 1,00,800.00  │ 2.5%  2,520  │ 2.5%  2,520  │  5,040.00 │
│ 5605 │   12,000.00  │ 6.0%    720  │ 6.0%    720  │  1,440.00 │
├──────┼──────────────┼──────────────┼──────────────┼───────────┤
│      │ 1,12,800.00  │       3,240  │       3,240  │  6,480.00 │
└──────┴──────────────┴──────────────┴──────────────┴───────────┘
```

## I.4 Amount in words

Indian convention — lakh and crore, not million:
```
₹1,05,840.00  →  "Rupees One Lakh Five Thousand Eight Hundred Forty Only"
₹1,05,840.50  →  "Rupees One Lakh Five Thousand Eight Hundred Forty and Fifty Paise Only"
```
Always ends with "Only". Derived from **integer paise** (Phase 6), never from a float.

## I.5 Rounding

```ts
// Line: rate × qty, rounded to paise
const lineAmount = Math.round(rate * qty);              // Paise

// Tax: on the line's taxable value, rounded to paise
const cgst = Math.round(lineAmount * rateBps / 20000);  // half of the GST rate

// Invoice: round the grand total to the nearest rupee, show the adjustment
const roundOff = Math.round(grandTotal / 100) * 100 - grandTotal;
```
The **Round Off** line is displayed explicitly when non-zero (`+₹0.40` / `−₹0.35`). Silently rounding a total is what makes an invoice fail reconciliation.

All arithmetic is on integer paise. **`parseFloat` never touches money.**

---

# PART J — THE LINE-ITEM TABLE

The print table is a different component from Phase 4's `DataTable` — no sorting, no hover, no pagination, and page-break-aware.

```css
.bk-doc__table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }

.bk-doc__table thead th {
  font-size: 8pt; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--print-ink);
  background: var(--print-fill);
  border-block: 0.5pt solid var(--print-rule);
  padding: 2mm 1.5mm;
  text-align: start;
}
.bk-doc__table td {
  padding: 1.8mm 1.5mm;
  border-bottom: 0.25pt solid var(--print-rule-light);
  vertical-align: top;
}
.bk-doc__table [data-num] {
  text-align: end;
  font-variant-numeric: tabular-nums;
}
.bk-doc__table thead { display: table-header-group; }   /* repeats on every page */
.bk-doc__table tr    { break-inside: avoid; }
```

`display: table-header-group` is what makes the column headers repeat on page 2, 3, 4 — without it, a 60-line invoice's continuation pages have unlabelled columns.

## J.1 Column widths (180mm content)

| Column | Width | Align |
|---|---|---|
| # | 8mm | center |
| Description | 62mm | start |
| HSN | 16mm | start (mono) |
| Qty | 14mm | end |
| Unit | 12mm | start |
| Rate | 24mm | end |
| Discount | 18mm | end |
| Amount | 26mm | end |
| **Total** | **180mm** | |

Description wraps; every other column is `nowrap`. Long saree-code ranges break onto a sub-line in `doc-code`.

---

# PART K — MULTI-PAGE RULES

```css
@media print {
  .bk-doc__totals,
  .bk-doc__tax-summary,
  .bk-doc__signature,
  .bk-doc__terms        { break-inside: avoid; }

  .bk-doc__signature    { break-before: avoid; }   /* never orphaned onto its own page */
  .bk-doc__table tbody tr { break-inside: avoid; }
  .bk-doc__table tfoot  { display: table-footer-group; }

  h1, h2, h3 { break-after: avoid; }
  p          { orphans: 3; widows: 3; }
}
```

| Rule | Spec |
|---|---|
| Running header (p2+) | 30mm: firm name, document type, document number, "Page n of m" |
| Column headers repeat | via `table-header-group` |
| "Continued…" | bottom-right of every page except the last |
| Totals never split | If they don't fit, the whole block moves to the next page |
| Signature never alone | `break-before: avoid` pulls at least the totals with it |
| Page numbers | `Page 1 of 3` — the total is required, so a recipient knows if a page is missing |
| Minimum tail | If fewer than 3 line items would land on the final page, pull more forward |

Pagination is computed client-side by measuring rendered row heights against the 247mm continuation height — so the on-screen preview page count matches the printed one exactly.

---

# PART L — PDF GENERATION

## L.1 Recommendation: server-side, headless Chromium

| Approach | Verdict |
|---|---|
| `html2canvas` + `jsPDF` | ❌ Rasterises to an image — no selectable text, no search, 10× file size, blurry at print DPI |
| `@react-pdf/renderer` | ❌ A second rendering engine means a second layout implementation — guaranteed drift from the print output |
| **Headless Chromium** (`page.pdf()`) | ✅ **Same engine, same CSS, same tree.** Vector text, selectable, searchable, small files, exact print parity |

```js
// backend
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluateHandle('document.fonts.ready');
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },   // the document owns its margins
  preferCSSPageSize: true,
});
```

**`printBackground: true` is essential** — without it the totals band and table header grounds are dropped.

## L.2 PDF requirements

| Requirement | Spec |
|---|---|
| Fonts | **Embedded subsets** — Fraunces, Inter, IBM Plex Mono. Never system-font fallback |
| Text | Selectable and searchable, never rasterised |
| Metadata | Title `Invoice INV-2627-0142`, Author `Beere Keshava & Brothers`, Subject, CreationDate |
| Filename | `INV-2627-0142_Sri-Silks_2026-06-12.pdf` — code, party, date |
| Size | Under 200KB for a single-page invoice |
| Archival | PDF/A-3 for documents that must be retained |
| Accessibility | Tagged PDF — `/H1`, `/Table`, `/TH` structure |

## L.3 Permission gating

Extending `DownloadAccess` — this is the gap Phase 7 closes:

```tsx
<DocumentActions>
  <PrintGate>    <Button iconLeft={Printer}>Print</Button>     </PrintGate>
  <DownloadGate> <Button iconLeft={Download}>PDF</Button>      </DownloadGate>
  <EmailGate>    <Button iconLeft={Mail}>Email</Button>        </EmailGate>
</DocumentActions>
```

| Scope | Accountant | Shop staff | Worker | Admin |
|---|---|---|---|---|
| View document | ✅ | invoices only | GRN only | ✅ |
| Print | ✅ | ✅ | ✅ | ✅ |
| Download PDF | ❌ | ❌ | ❌ | ✅ |
| Email to party | ❌ | ❌ | ❌ | ✅ |

**Today, `DownloadAccess` gates the download button but not `window.print()`** — so an accountant blocked from exporting can still Print → Save as PDF. Phase 7 closes that with `PrintGate`, and a blocked print attempt shows a toast explaining why rather than failing silently.

---

# PART M — DATA EXPORT

Distinct from documents. `xlsx` is already a dependency, used in 8 files.

```tsx
exportTable({ columns, rows, filename, format: 'xlsx' });
```

Driven by the same `ColumnDef[]` as the on-screen table (Phase 4), honouring `exportable`.

| Rule | Spec |
|---|---|
| Headers | The column `header` string, not the `id` |
| Money | **Raw number** in a currency-formatted cell — never the `₹1.2L` string |
| Dates | ISO `2026-06-12` as a real date cell, not text |
| Codes | Text-formatted so Excel doesn't mangle `INV-2627-0142` |
| Filename | `Sarees_2026-06-12_1430.xlsx` |
| Formats | XLSX (default), CSV (UTF-8 **with BOM**, so Excel reads ₹ correctly) |
| Scope | Current filters and sort applied; a banner states "Exporting 412 filtered rows of 1,204" |
| Gating | `DownloadGate` |
| Progress | Over 1,000 rows → `toast.promise` |

---

# PART N — IMPLEMENTATION PLAN

### Step 1 — Stop printing the whole app *(3 hours — highest urgency)*
Add `<div id="document-print-root">` to `index.html` and land the Part C.2 stylesheet in `tokens.css`. Even before any document is rebuilt, this stops the six existing print buttons from emitting the nav, scrim and background page.

### Step 2 — Build the document layer *(1 week)*
```
shared/ui/document/
  DocumentPage.tsx      Letterhead.tsx     PartyBlock.tsx
  MetaBlock.tsx         LineItemTable.tsx  TotalsBlock.tsx
  TaxSummary.tsx        AmountInWords.tsx  TermsBlock.tsx
  SignatureBlock.tsx    RunningHeader.tsx  DocumentViewer.tsx
  useDocument.ts        usePagination.ts
lib/gst/
  hsn.ts   taxSplit.ts   amountInWords.ts   rounding.ts
styles/
  print.css
```

### Step 3 — GST engine *(3 days)*
`taxSplit`, the HSN registry, rate-wise summary, `amountInWords`, and paise-integer rounding. Unit-test the boundaries — 5% split into 2.5+2.5 on odd paise amounts is where rounding bugs live.

### Step 4 — Fix the invoice money arithmetic *(4 hours)*
```bash
rg -n "parseFloat\(data.prices|parseFloat\(data.gstPct" frontend/src
```
Convert `InvoiceGenerator` to branded `Paise` (Phase 6). This is a correctness fix, not cosmetic.

### Step 5 — Build the six documents *(1 week)*
Order by usage: Invoice → Purchase Order → Quotation (collapses **three** implementations) → Delivery Challan → Receipt → Statement.

### Step 6 — Replace `window.print()` *(2 hours)*
```bash
rg -n "window.print\(\)" frontend/src   # 6
```
All six → `useDocument().print(<Doc … />)`.

### Step 7 — PDF service *(3 days, backend)*
Headless Chromium endpoint, font embedding, metadata, filename convention.

### Step 8 — Export standardisation *(2 days)*
```bash
rg -l "xlsx" frontend/src/features   # 8
```
Consolidate into `exportTable`, driven by `ColumnDef`.

### Step 9 — Enforce *(1 hour)*
```js
{ selector: 'CallExpression[callee.object.name="window"][callee.property.name="print"]',
  message: 'Use useDocument().print(). Raw window.print() prints the whole app.' },
{ selector: 'CallExpression[callee.name="parseFloat"]',
  message: 'Money is integer paise. parseFloat on currency is a correctness bug.' },
```

---

# PART O — DEFINITION OF DONE

- [ ] `@media print` stylesheet exists; printing emits **only** the document
- [ ] `rg "window.print()"` → **0** raw calls; all via `useDocument`
- [ ] Nav, scrim, modal chrome and background page do not print
- [ ] Documents render at true A4 (210 × 297mm) with 15mm side margins
- [ ] Print type scale in `pt`; nothing below **7.5pt**
- [ ] Body text prints `#000000`; brand colour appears at most twice per page
- [ ] Column headers repeat on every continuation page
- [ ] Totals, tax summary and signature never split across pages
- [ ] `Page n of m` on every page
- [ ] CGST/SGST vs IGST derived from GSTIN state code and place of supply
- [ ] HSN/SAC on every line item; rate-wise tax summary when rates differ
- [ ] Amount in words in Indian lakh/crore convention
- [ ] Round-off line shown explicitly when non-zero
- [ ] **No `parseFloat` in any money path**; all arithmetic on integer paise
- [ ] Invoice line amounts sum exactly to the taxable value
- [ ] Three quotation implementations collapsed into **one**
- [ ] PDF via headless Chromium; text selectable; fonts embedded; <200KB
- [ ] `PrintGate` blocks print for roles that can't export — closing the Print-to-PDF bypass
- [ ] Export uses `ColumnDef`; money as numbers, dates as dates, codes as text
- [ ] CSV is UTF-8 with BOM
- [ ] Visual check: print one of each document type on a real printer
- [ ] Photocopy check: a black-and-white copy remains fully legible
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` clean

---

# PART P — WHAT PHASE 7 DOES *NOT* DO

- ❌ GST return filing, GSTR-1/3B generation — backend/compliance scope
- ❌ E-way bill or e-invoice IRN generation — government API integration
- ❌ Digital signatures (DSC) — a separate cryptographic concern
- ❌ Email delivery infrastructure — Phase 7 defines the button and the attachment contract
- ❌ Document versioning and audit trail — backend
- ❌ Executing the full migration of all 15 document files — **Phase 8**

---

## What Phase 7 eliminates

| Before | After |
|---|---|
| **Printing an invoice prints the entire app** — nav, scrim, background page | Only the document |
| **0 `@media print` rules** for 6 print buttons | Full print stylesheet |
| **No PDF library** — no shareable document exists | Headless Chromium, vector, embedded fonts |
| Screen colours on paper | Dedicated print colour set, photocopy-safe |
| 15 bespoke document files, **3 quotation implementations** | 1 `DocumentPage`, 6 document types |
| No CGST/SGST/IGST split | Derived from GSTIN state code |
| No HSN/SAC codes | Mandatory per line item |
| No amount in words, no tax summary, no round-off | All present |
| `parseFloat` money arithmetic in the invoice | Integer paise |
| Screen type (14px) on paper | Print scale in pt, 7.5pt floor |
| No page numbers, headers don't repeat | `Page n of m`, repeating headers |
| Export blocked but Print-to-PDF open | `PrintGate` closes the bypass |
