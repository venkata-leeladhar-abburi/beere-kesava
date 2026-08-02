## FIGMA MAKE PROMPT

### Finishing Staff Portal — All 5 Pages

### Beere Kesava & Brothers Silks ERP · Est. 1999

---

You are designing the complete **Finishing Staff Portal** for the **Beere Kesava & Brothers Silks ERP (Est. 1999)**. This portal is used by finishing staff to complete saree finishing work and dispatch — both to the retail shop and to wholesale customers. Design both desktop (1440px) and mobile (390px) versions for all 5 pages. The desktop version follows the same design language as the Admin and Superadmin dashboards. The mobile version follows the same design language as the Worker Staff portal. Attach all existing portal screenshots as visual reference.

**IMPORTANT FLOW TO REMEMBER:**

- Quality Check is done by Worker Staff — NOT Finishing Staff
- Finishing Staff only receives sarees AFTER a sale is confirmed (retail) OR after admin assigns a wholesale batch directly
- Finishing Staff never sees raw material data or worker staff data
- All dispatch drafts go to Admin — Admin finalises and sends to customer

---

## DESIGN SYSTEM — Apply Exactly

**Colors:**
Background: `#FFFFFF` · Primary burgundy: `#6B1A2A` · Dark: `#3D0E1A` · Gold: `#C4923A` · Green: `#1E6640` · Crimson: `#C0392B` · Text: `#1A0A0F` · Muted: `#8B7060` · Card border: `rgba(139,26,46,0.12)` · Cream: `#F0E8D0` · Input background: `#FFF8E7`

**Typography:**
Playfair Display — page titles and large numbers
DM Sans — all UI text, labels, buttons, descriptions — minimum 14px
DM Mono — all codes, IDs, quantities, barcodes

**Desktop canvas:** 1440px width · same layout as Admin dashboard
**Mobile canvas:** 390px width · same layout as Worker Staff portal

**Cards:** White · `1px solid rgba(139,26,46,0.12)` border · 14–16px radius · soft shadow

**Desktop navigation:** Top horizontal nav bar — same as Admin portal
**Mobile navigation:** Bottom tab bar — 5 tabs — same as Worker Staff portal

**Inputs:** Minimum 52px height on mobile · 44px on desktop · `#FFF8E7` warm cream background · 12px radius · label always above input

**Buttons:** Always icon + text · 999px radius for primary · minimum 52px height mobile · 44px desktop

**Touch targets:** Minimum 44px × 44px on mobile

**Plain language:** Full words · no abbreviations · clear for non-technical users

**Icons:** Use same dashboard icon set established across all existing portal pages

---

## DESKTOP NAVIGATION — Top Bar

Same pattern as Admin portal top nav:
Left: Beere Kesava & Brothers Silks logo + "Est. 1999"
Center tabs: "Home" · "Finishing" · "Inventory" · "Dispatch to Shop" · "Dispatch to Wholesale"
Right: Search icon · Bell icon with notification count · "FS · Finishing Staff" avatar — blue circle to distinguish from Admin (burgundy) and Superadmin (gold)

Active tab: burgundy 2px underline · dark text
Inactive: muted text

---

## MOBILE NAVIGATION — Bottom Tab Bar

Height 64px · white background · top border `rgba(139,26,46,0.12)` · shadow upward

5 tabs — icon above label:
Tab 1: 🏠 "Home"
Tab 2: ✂ "Finishing"
Tab 3: 📦 "Inventory"
Tab 4: 🏪 "To Shop"
Tab 5: 🚚 "Wholesale"

Active: burgundy icon + label · 2px burgundy top border
Inactive: muted gray

---

## GLOBAL HEADER — Mobile Only

Height 56px · burgundy `#6B1A2A` background
Left: Hamburger menu icon · white
Center: Page title · Playfair Display 600 18px white
Right: Bell icon · white · red badge if notifications

---

## PAGE 01 — HOME / ASSIGNED BATCHES

**PURPOSE:** Finishing staff sees all work assigned to them by admin. Two types of assignments — retail sarees (individual sarees sold) and wholesale batches (bulk orders assigned directly).

---

### DESKTOP VERSION:

**Page header — compact dark:**
Same pattern as Admin pages
Eyebrow: "SINCE 1999 · FINISHING STAFF · HOME"
Heading: "Assigned Work" — Playfair Display 700 36px white
Sub: "& Today's Tasks" — Playfair Display 500 italic 24px gold
Description: "These sarees have been assigned to you for finishing. Complete finishing work before dispatch." — DM Sans 14px rgba white 60%

**Stats strip — dark burgundy · 4 columns:**
Column 1: "ASSIGNED FOR FINISHING" · "18 sarees" · Playfair 700 28px white
Column 2: "FINISHING IN PROGRESS" · "6 sarees" · gold highlight
Column 3: "FINISHING COMPLETE — READY TO DISPATCH" · "8 sarees" · green
Column 4: "DISPATCHED TODAY" · "4 sarees" · muted

**Two assignment sections:**

**Section A — Retail Assignments:**
Section title: burgundy bar + "Retail Sarees — Sold and Assigned for Finishing"
Sub: "These sarees have been sold to retail customers. Complete finishing before dispatch to shop." — DM Sans 13px muted

Assignment cards — 3 column grid:
Each card: white · 16px radius · border · shadow sm · green left border 4px (retail)

Card content:

- Saree ID: DM Mono 14px burgundy — large · "PADMA-L1-004"
- "Retail Sale" badge: green pill · DM Mono 9px
- Design: "BKB-045 · Self Brocade" — DM Sans 600 13px
- Assigned by: "Admin (BK) · Today 10:30 AM" — DM Sans 12px muted
- Status: "⏳ Awaiting Finishing" gold badge
- "✂ Start Finishing" button — burgundy filled · icon + text

**Section B — Wholesale Batch Assignments:**
Section title: burgundy bar + "Wholesale Batches — Assigned for Finishing"
Sub: "These batches have been assigned directly by admin for a wholesale order. Complete all sarees before dispatch." — DM Sans 13px muted

Batch cards — 3 column grid:
Gold left border 4px (wholesale)

Card content:

- Batch ID: DM Mono 14px burgundy · "BATCH-086"
- "Wholesale Order" badge: gold pill
- Customer: "Lakshmi Silks · ORD-2026-041"
- Sarees: "5 sarees to finish" — Playfair 600 20px dark
- Progress bar: gold fill · "2 of 5 done" below
- Design: "BKB-031 · Heavy Zari"
- Assigned: "Admin (BK) · Yesterday"
- "✂ Continue Finishing" button — burgundy filled

---

### MOBILE VERSION:

**Worker identity strip:**
Dark `#3D0E1A` · padding 16px 20px
Avatar circle 44px blue · "Good morning," rgba white 60% · Staff name white DM Sans 600 18px

**Pending tasks — 2 task cards:**

Task 1: "Retail Sarees to Finish" · count badge · "↗ Go to Finishing" tap
Task 2: "Wholesale Batches to Finish" · count badge · "↗ Go to Finishing" tap

**Quick stats 2×2 grid:** Assigned · In Progress · Ready to Dispatch · Dispatched Today

**Assignment list — stacked cards:**
Each card same content as desktop but full width · stacked vertically

---

## PAGE 02 — FINISHING OPERATIONS

**PURPOSE:** Finishing staff completes finishing work saree by saree. Scan barcode to open saree record. Mark complete. No individual step checkboxes — just mark finishing done and packaging done.

---

### DESKTOP VERSION:

**Page header:** Same compact dark pattern
Eyebrow: "SINCE 1999 · FINISHING STAFF · FINISHING OPERATIONS"
Heading: "Finishing Operations"
Sub: "Mark each saree through finishing and packaging"

**Active finishing queue — left panel (35% width):**
White card · full height · border right
Title: "Sarees to Finish" — DM Sans 600 14px
List of assigned sarees — each row:
Saree ID DM Mono burgundy · Design chip · Status dot (green/gold/gray) · Click to open

**Saree detail panel — right (65% width):**
When saree selected from left:

**Saree info card:**
Saree ID large: DM Mono 700 24px burgundy
Design: Playfair Display 600 18px dark
Source badge: "🪡 Outsourced · Padma Veni" or "🏭 Own Factory · Loom 3"
Assignment type: "Retail Sale" green pill or "Wholesale · Lakshmi Silks" gold pill

**Finishing checklist — two large action cards:**

**Card 1 — Finishing:**
White card · border · padding 20px
"Finishing Work" — DM Sans 600 16px dark
Sub: "Iron, polish, cut threads, fold this saree. Once physically done — mark complete below."
DM Sans 13px muted · line-height 1.6
"✓ Mark Finishing Complete" — `#1E6640` green filled button · full width · 48px height
After click: Card turns green · "✓ Finishing Done · [timestamp]" · DM Sans 600 14px green

**Card 2 — Packaging:**
Same structure
"Packaging Work"
Sub: "Package this saree, remove paper barcode tag, prepare for dispatch."
"✓ Mark Packaging Complete" — green filled button
After click: Card turns green · "✓ Packaging Done · [timestamp]"

**When both complete:**
Full width green success strip:
"✓ SAREE-PADMA-L1-004 is fully finished and ready for dispatch" — DM Sans 600 14px green
"Move to Dispatch →" gold link right

---

### MOBILE VERSION:

**Scan to open saree:**
Large scan button at top · full width · 56px · "📷 Scan Saree Barcode" · burgundy filled
Or: "Enter Saree ID manually" text link below

**After scan — saree info card:**
Saree ID large · Design · Assignment type badge · Source badge

**Two action buttons stacked:**
"✓ Mark Finishing Complete" — green filled · full width · 56px
"✓ Mark Packaging Complete" — green filled · full width · 56px · appears after finishing marked

**Progress indicator:**
"Step 1 of 2 — Finishing" → "Step 2 of 2 — Packaging" → "✓ Complete"
Simple text progress at top of card

---

## PAGE 03 — FINISHED GOODS INVENTORY

**PURPOSE:** View only. Shows all sarees assigned for finishing — their status (awaiting finishing, in progress, finished, dispatched). Finishing staff cannot see raw material data or worker staff data.

---

### DESKTOP VERSION:

**Page header:**
Eyebrow: "SINCE 1999 · FINISHING STAFF · INVENTORY"
Heading: "Finished Goods Inventory"
Sub: "Sarees Assigned for Finishing"

**Note strip:**`#F0E8D0` cream · 10px radius · padding 12px 20px
"You can only see sarees assigned to finishing. Raw material stock and worker staff data are not visible here." — DM Sans 13px muted

**Filter bar:**
Filter pills: "All Assigned" (active) · "Awaiting Finishing" · "Finishing Done" · "Dispatched"
Filter by: Design code dropdown · Assignment type dropdown (Retail/Wholesale)
Search: "Search by saree ID or design code..."

**Inventory table:**
White card · full width · 16px radius · shadow

Columns:
Saree ID · Design Code · Saree Type · Assignment Type · Customer/Destination · Assigned Date · Finishing Status · Packaging Status · Dispatch Status · Action

**Saree ID:** DM Mono 12px burgundy
**Assignment Type:** "Retail" green pill · "Wholesale" gold pill
**Finishing Status:** "⏳ Pending" gold · "✓ Done" green
**Packaging Status:** same
**Dispatch Status:** "⏳ Pending" · "✓ Dispatched"
**Action:** "View" ghost button

**Paginated:** 25 rows per page

---

### MOBILE VERSION:

**Filter pills:** horizontal scroll row · same filters
**Cards view:** each saree as a card · Saree ID large · Design · Assignment type badge · Status dots for Finishing/Packaging/Dispatch

---

## PAGE 04 — DISPATCH TO SHOP

**PURPOSE:** Finishing staff prepares a dispatch draft for sarees going to the retail shop. Enters all details, uploads LR document photo. Draft sent to admin. Admin finalises and confirms.

**IMPORTANT:** No invoice needed for shop dispatch. Stock moves from factory to shop. Finishing staff submits draft only — admin sends final confirmation.

---

### DESKTOP VERSION:

**Page header:**
Eyebrow: "SINCE 1999 · FINISHING STAFF · DISPATCH TO SHOP"
Heading: "Dispatch to Shop"
Sub: "& Internal Transfer Documentation"
Description: "Prepare the dispatch draft for sarees going to the retail shop. Your draft will be sent to admin for final confirmation." — DM Sans 14px rgba white 60%

**Draft notice strip:**
Gold background `rgba(196,146,58,0.10)` · gold border · 12px radius · padding 14px 20px
"📋 You are preparing a dispatch DRAFT. Admin will review and confirm before stock moves." — DM Sans 500 13px gold

---

**DISPATCH DRAFT FORM:**

White card · 16px radius · shadow · padding 28px

**Step 1 — Select Sarees for Dispatch:**
Section label: "Step 1 — Which sarees are going to the shop?" — DM Sans 600 14px burgundy

Table of finished sarees ready for shop dispatch:
Checkbox column · Saree ID · Design · Finishing Status · Packaging Status

Select via checkbox · or "📷 Scan Barcode to Add" button above table

After selecting: "X sarees selected for this dispatch" — DM Mono 12px burgundy · count chip

**Step 2 — Transport Details:**
Section label: "Step 2 — Transport and LR Details" — DM Sans 600 14px burgundy

2-column form grid:

- "LR Number" — text input · DM Mono · "Lorry Receipt number from transporter"
- "Transport Company Name" — text input · "Name of transport company"
- "Vehicle Number" — text input · DM Mono · "Vehicle registration number"
- "Dispatch Date" — date picker · default today
- "Driver Name (Optional)" — text input
- "Notes" — textarea · "Any additional details for admin"

**Step 3 — Upload LR Document:**
Section label: "Step 3 — Upload LR Receipt Document" — DM Sans 600 14px burgundy
Sub: "Take a clear photo of the physical LR document given by the transport company." — DM Sans 13px muted

Upload area · dashed border · 12px radius · center aligned
"📷 Take Photo of LR Document" burgundy filled · "🖼 Choose from Gallery" ghost · side by side
After upload: document thumbnail preview · "Change Document" small link

**Step 4 — Review Draft:**
Section label: "Step 4 — Review Before Sending to Admin" — DM Sans 600 14px burgundy

Summary card `#F0E8D0` cream:
Sarees: count · Design codes · LR Number · Transport · Vehicle · Date
"This draft will be sent to Admin. Admin will confirm and finalise the dispatch."

**Submit button:**
"📤 Send Draft to Admin" — burgundy filled · large · full width · 56px · icon + text

After submit: success screen:
Green checkmark 48px · "Draft Sent to Admin" Playfair 600 22px · "Admin will review and confirm this dispatch. You will be notified once confirmed." DM Sans 13px muted

---

### MOBILE VERSION:

Same 4-step flow adapted for mobile:
Each step as a full-width section · stacked vertically · large inputs · camera buttons prominent
"Send Draft to Admin" button — full width · 56px · sticky at bottom

---

## PAGE 05 — DISPATCH TO WHOLESALE CUSTOMER

**PURPOSE:** Finishing staff prepares a dispatch draft for wholesale orders. More detailed than shop dispatch — includes customer details, bulk order reference, all documentation. Draft sent to admin. Admin generates invoice and sends everything to customer.

**IMPORTANT:** Finishing staff submits draft only. Admin has a separate invoice generator in the portal. Admin generates invoice, finalises, and sends to customer. Customer is notified by admin — not by finishing staff.

---

### DESKTOP VERSION:

**Page header:**
Eyebrow: "SINCE 1999 · FINISHING STAFF · WHOLESALE DISPATCH"
Heading: "Dispatch to Wholesale Customer"
Sub: "& Documentation Draft"
Description: "Prepare the complete dispatch draft for wholesale orders. Your draft goes to admin. Admin generates the invoice and sends all documents to the customer." — DM Sans 14px rgba white 60%

**Draft notice strip:**
Same gold strip as Page 04 but with additional note:
"📋 Dispatch Draft — Admin will generate the invoice and notify the customer after reviewing your draft." — DM Sans 500 13px gold

---

**WHOLESALE DISPATCH DRAFT FORM:**

White card · 16px radius · shadow · padding 28px

**Step 1 — Select Customer and Order:**
Section label: "Step 1 — Which customer is this dispatch for?" — DM Sans 600 14px burgundy

Customer dropdown: search input · shows wholesale customer list
After selection: customer info card:
Customer name Playfair 600 16px · Code DM Mono · City · Payment terms chip

Bulk order auto-populated:
"Linked Order: ORD-2026-041" — DM Mono burgundy chip
"80 sarees ordered · 76 produced · 4 remaining" — DM Sans 13px muted
If no linked order: "No linked order — standalone dispatch" note

**Step 2 — Select Sarees for Dispatch:**
Same checkbox table as Page 04
After selecting: "X sarees selected · Bulk order: Y% complete after this dispatch"

**Step 3 — Transport and LR Details:**
Same fields as Page 04 shop dispatch plus:

- "Expected Delivery Date" — date picker
- "Special Instructions for Customer (Optional)" — textarea

**Step 4 — Upload LR Document:**
Same as Page 04

**Step 5 — Draft Summary:**
Section label: "Step 5 — Complete Draft Summary" — DM Sans 600 14px burgundy

Summary card `#F0E8D0` cream · full width:
Customer: name + code
Order: ORD reference
Sarees dispatching: count + saree IDs (DM Mono list)
Design codes: chips
LR Number: DM Mono
Transport: company + vehicle
Date: dispatch date
"📌 Admin will add: Invoice number, final pricing, payment terms, and send to customer"
— DM Sans 12px muted italic · gold background strip inside summary

**Submit button:**
"📤 Send Complete Draft to Admin" — `#6B1A2A` burgundy filled · large · 56px · full width

After submit: success screen:
Green checkmark · "Draft Sent to Admin" Playfair 600 22px
"Admin will generate the invoice and send all documents to Lakshmi Silks. You will be notified once dispatched." — DM Sans 13px muted
Payment tracking reference: "Payment tracking will start after admin confirms dispatch" — DM Mono 11px gold chip

---

### MOBILE VERSION:

Same 5-step flow adapted for mobile:
Each step as full-width section · large inputs · camera prominent
"Send Complete Draft to Admin" — full width sticky button at bottom · 56px

---

## COMPLETE PAGE SCROLL ORDER (Both Versions)

**Desktop:** Top nav → Page header dark → Stats strip → Main content sections → Footer
**Mobile:** Global header → Content → Bottom tab bar fixed

---

## IMPORTANT DESIGN NOTES

**1 — Finishing staff never sees:**
Raw material stock · Worker staff entries · Defective saree counts · Making charge rates · Supplier details · Pricing or margins

**2 — Two assignment types always visually distinct:**
Retail = green left border + green pill badge
Wholesale = gold left border + gold pill badge
Never mixed in same list without clear visual separation

**3 — Draft vs Final is always communicated:**
Every dispatch page shows the gold draft notice strip at top. Finishing staff must always know they are submitting a draft — not the final dispatch.

**4 — Scan barcode is always the primary input method:**
Every page where a saree needs to be identified — scan barcode is the first and largest button. Manual entry is secondary smaller link.

**5 — Admin receives all drafts:**
Both shop dispatch drafts and wholesale dispatch drafts go to admin. Admin finalises shop dispatch and generates invoice for wholesale dispatch.

**6 — Firm name:** Beere Kesava & Brothers Silks · Est. 1999

**7 — Icons:** Use same icon set established across all existing portal pages. No new icon styles.

**8 — Language:** English only · plain words · full labels · no abbreviations

---

## DELIVERABLE

5 complete pages — each in desktop (1440px) and mobile (390px) versions:

1. Home / Assigned Batches
2. Finishing Operations
3. Finished Goods Inventory
4. Dispatch to Shop
5. Dispatch to Wholesale Customer

Total: 10 screens (5 desktop + 5 mobile)