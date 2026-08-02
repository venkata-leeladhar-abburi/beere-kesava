## COMPLETE CONFIRMED CHANGE LOG

### All 16 Changes — Beere Kesava & Brothers Silks ERP

---

### CHANGE 1 — Jari Measurement Unit

- Unit: Buns and Reels both shown everywhere
- 1 Bun = 4 Reels
- Display format: "24 Buns (96 Reels)"
- Worker enters Jari quantity in Reels when issuing to weaver
- Low stock threshold set by superadmin in Buns or Reels
- Weight per saree still in grams

### CHANGE 2 — Jari Types, Grades and Colors

- Two types: Polyester and Silk Fast
- Each type has 5 grades: 1G · 2G · 3G · 4G · 5G
- Each grade has 6 colors: Gold · Silver · Copper · Pink · Blue · Green
- Each unique combination = separate inventory entry with own batch

### CHANGE 3 — Jari Color Display

- Show stock per color in individual rows — quantity in Buns + Reels
- Show visual color indicator strip/dots
- Color code by stock health — green/gold/crimson

### CHANGE 4 — Production Flow (MAJOR)

- New flow: QC Passed → Stock → Sale Confirmed → Finishing → Dispatch
- Finishing only after confirmed sale
- "Assign to Finishing" moves to Sales/Dispatch page
- Finishing Staff portal shows "Sarees Sold — Send to Finishing"

### CHANGE 5 — Remove Rough Quotation

- Remove entirely from all pages and portals

### CHANGE 6 — Stock Record After QC

- Full details: Saree ID, Barcode, Weaver, Weight, QC Date, Design Code, Saree Type

### CHANGE 7 — Pages Affected

- Overview, Materials, Production, Worker Portal, Finishing Portal, Reports, Payments

### CHANGE 8 — Two Production Sources

- Own Factory: record loom number
- Outsourced Weaver: record weaver details
- Every saree tagged as "Own Factory" or "Outsourced"
- Reports show split clearly everywhere

### CHANGE 9 — Six Firms for Billing

- 6 separate legal entities — added by superadmin
- Admin selects which firm makes each payment
- System records: which firm paid, to whom, how much
- Each firm has its own payment ledger tracked separately

### CHANGE 10 — Bulk Order Payment Alerts

- Daily alerts start from Day 45 after dispatch
- Not 60–90 days as previously set

### CHANGE 11 — Design Library in Weaver Portal

- Weaver can view all designs, color slips, and design graphs
- View only — no upload or edit access

### CHANGE 12 — New Weaver Registration Fields

- Photo of weaver — mandatory (for easy identification)
- Email ID — mandatory (for records and notifications)
- Name collected as First Name + Last Name separately

### CHANGE 13 — Batch ID Format

**Vendor/Raw Material Batches:**

- Format: Vendor first name short + number
- Example: Vendor "Sri Venkateswara" → "SRI-001"
- Short name taken from vendor's first name
- Set automatically from vendor first name

**Weaver Saree ID:**

- Format: Weaver first name + Loom number + sequence
- Example: Weaver "Ravi Kumar" on Loom 2 → "RAVI-L2-001"

**Own Factory Saree ID:**

- Format: Factory short code + Loom number + sequence
- Example: BKB-L3-001 for Loom 3, sequence 1

### CHANGE 14 — Weaver Name Format

- Collect: First Name + Last Name as separate fields
- Use First Name only in IDs and barcodes

### CHANGE 15 — Saree Barcode + QR Code

- Print barcode on saree (machine-printed, scanner-readable)
- Along with barcode print: Weaver first name + Weight + firm name
- Firm name on label: "Beere Keshava & Brothers Silks · Est. 1999"
- Also add QR code alongside barcode for phone scanning
- When QR code scanned on phone — all saree details appear

### CHANGE 16 — Firm Name Correction Everywhere

- Correct name: **Beere Kesava & Brothers Silks**
- Correct year: **Est. 1999**
- Update everywhere: nav logo, hero, footer, documents, labels, login, all portals

---

Now I will write the complete Figma Make prompt. Because there are 16 changes affecting multiple pages, I will write this as **one master correction prompt** that covers all pages together. You will attach all 7 admin dashboard screenshots when running it.

---

## COMPLETE FIGMA MAKE PROMPT

### Beere Kesava & Brothers Silks ERP — Admin Dashboard

### Master Correction Prompt — All 16 Client Changes

---

You are applying a set of confirmed client changes to the existing **Beere Kesava & Brothers Silks ERP Admin Dashboard**. All 7 admin page screenshots are attached as reference. Study every page carefully. Apply each change exactly as described. Do not change anything that is not mentioned. Preserve all existing design language — colors, typography, card styles, section patterns, photography — exactly as built.

---

## DESIGN SYSTEM REFERENCE — Do Not Change These

Background: `#FFFFFF`
Primary burgundy: `#6B1A2A`
Dark section background: `#3D0E1A`
Gold accent: `#C4923A`
Text primary: `#1A0A0F`
Text muted: `#8B7060`
Green: `#1E6640`
Crimson: `#C0392B`
Card: white background, subtle border, 14–16px border radius, soft shadow
Section title: burgundy vertical bar + DM Sans 600 title + gold right link
Typography: Playfair Display for large numbers and headings, DM Sans for UI, DM Mono for codes
All buttons: icon + text label always

---

## CORRECTION 1 — FIRM NAME AND YEAR — Apply Everywhere

Find every instance of the firm name and year across all 7 pages and update:

**Correct firm name:** Beere Kesava & Brothers Silks
**Correct year:** Est. 1999

Update in every location:

- Top navigation logo area — "Beere Keshava / & Brothers Silks / Est. 1999"
- Hero section eyebrow — "SINCE 1999 · HERITAGE CRAFTSMANSHIP"
- Footer brand area — "Beere Keshava & Brothers Silks · Est. 1999"
- Footer copyright — "© 2026 Beere Keshava & Brothers Silks. All rights reserved."
- Any document headers, barcode labels, or stamp areas

Do not change 1945 to 1999 anywhere — the correct year is 1999 throughout.

---

## CORRECTION 2 — JARI MEASUREMENT UNIT — Materials Page + All Affected Areas

**Rule:** Jari is no longer measured in kg or grams. It is measured in Buns and Reels.
**Conversion:** 1 Bun = 4 Reels
**Display format always:** "24 Buns (96 Reels)" — show both values together everywhere

**Apply these changes across all pages:**

**On the Overview page — Raw Material Overview section:**
The Jari card currently shows "90 kg" — change to show:

- Stock number: "36 Buns" — Playfair Display 700 28px crimson (if low stock)
- Below: "(144 Reels)" — DM Sans 13px muted
- Remove all kg/gram references from the Jari card
- Keep the Low Stock Alert badge as is

**On the Materials page — Material Stats Strip:**
Column 4 (Jari In Stock):

- Change "90 kg" to "36 Buns (144 Reels)"
- Sub-label: "3 types available · some colors low"

**On the Materials page — Current Stock Overview — Jari Card:**

- Stock number: "36 Buns" — Playfair Display 700 28px
- Below: "(144 Reels total across all types and colors)"
- Remove "90 kg" and all gram/kg references
- Sub-label: "Polyester and Silk Fast · 5 Grades · 6 Colors"

**On the Materials page — All Material Batches Table:**

- In the Jari rows — change the "Quantity" column header to show "Quantity (Buns / Reels)"
- Each Jari batch row shows: "6 Buns (24 Reels)" in the quantity columns
- "Amount Received", "Amount Given to Weavers", "Amount Remaining" all show Buns + Reels format

**On the Materials page — Material Given to Weavers section:**

- Jari row in each weaver card changes from "Jari: PLY-2G-Gold 200g" to "Jari: PLY-2G-Gold · 3 Reels"

**On the Materials page — Purchase History section:**

- Vendor table Jari rows: change kg to Buns
- "Price per Bun" instead of "Price per kg"
- "Total Buns purchased" instead of "Total kg"

---

## CORRECTION 3 — JARI TYPES, GRADES AND COLORS — Materials Page Complete Redesign of Jari Section

**Jari structure to implement:**

Two main types: Polyester · Silk Fast
Each type has 5 grades: 1G · 2G · 3G · 4G · 5G
Each grade has 6 colors: Gold · Silver · Copper · Pink · Blue · Green
Each unique combination (Type + Grade + Color) = separate inventory entry

**Jari Card in Current Stock Overview — Redesign:**

Replace the simple Jari card with an expanded Jari card that shows color breakdown.

Card structure:

- Photo top: same metallic thread photography — 160px height
- "Jari" — Playfair Display 600 20px
- "Metallic Thread · Polyester and Silk Fast · 5 Grades · 6 Colors"
- Total stock: "36 Buns (144 Reels) total" — Playfair Display 700 28px
- Progress bar — overall stock health

Below total — Color availability grid:
Title: "Stock by Color" — DM Sans 600 12px dark, margin-bottom 10px

6 color rows — one per color. Each row:

- Color dot: 12px filled circle in the actual color
Gold dot: `#C4923A`
Silver dot: `#9E9E9E`
Copper dot: `#B87333`
Pink dot: `#E91E8C`
Blue dot: `#1565C0`
Green dot: `#2E7D32`
- Color name: DM Sans 500 12px dark
- Stock: DM Mono 11px — "8 Buns (32 Reels)" — right aligned
- Mini progress bar: 40px wide, 3px height, color matches the dot color
- Stock status: tiny pill — "✓ OK" green or "⚠ Low" gold or "🔴 Critical" crimson

Sample data:
Gold · 8 Buns (32 Reels) · ✓ OK
Silver · 6 Buns (24 Reels) · ✓ OK
Copper · 4 Buns (16 Reels) · ⚠ Low
Pink · 3 Buns (12 Reels) · ⚠ Low
Blue · 2 Buns (8 Reels) · 🔴 Critical
Green · 5 Buns (20 Reels) · ✓ OK

**Jari Batches in the All Material Batches Table:**

Each Jari batch row now shows Type + Grade + Color clearly:
Batch ID format: [VendorFirstName]-[Type][Grade][Color]-[SEQ]
Example: SURAT-PLY2GGOLD-001

Columns for Jari rows:

- Batch ID: DM Mono 11px burgundy
- Material Type: "Jari"
- Type Details: "Polyester · 2G · Gold" — with small gold color dot before "Gold"
- Quantity: "6 Buns (24 Reels)"
- Given to Weavers: "3 Reels"
- Remaining: "21 Reels" or "5 Buns 1 Reel"
- Status badge: as existing

Show at minimum 6 Jari batch rows covering different type/grade/color combinations:
Row 1: SURAT-PLY2GGOLD-001 · Polyester · 2G · Gold (●) · 8 Buns (32 Reels) · In Stock
Row 2: SURAT-PLY1GSLVR-002 · Polyester · 1G · Silver (●) · 3 Buns (12 Reels) · Low Stock
Row 3: SURAT-PLY3GCPPR-001 · Polyester · 3G · Copper (●) · 4 Buns (16 Reels) · In Stock
Row 4: VARA-SF2GGOLD-001 · Silk Fast · 2G · Gold (●) · 6 Buns (24 Reels) · In Stock
Row 5: VARA-SF1GBLUE-001 · Silk Fast · 1G · Blue (●) · 2 Buns (8 Reels) · Critical
Row 6: VARA-SF3GPINK-001 · Silk Fast · 3G · Pink (●) · 3 Buns (12 Reels) · Low Stock

---

## CORRECTION 4 — PRODUCTION FLOW CHANGE — Production Page

**Remove entirely from the Production page:**

- The entire "Rough Quotation Preparation" section — remove completely, no replacement
- The "Assign to Finishing" button from all batch cards and batch lists
- The "Sarees Ready for Finishing" section — remove completely
- Any "Ready for Finishing" status badge — replace with "In Stock — Ready for Sale"

**Update the Production flow stages shown on the page:**

Old stage labels → New stage labels:

- "Weaving In Progress" → stays the same ✓
- "Sarees Submitted — Waiting Quality Check" → stays the same ✓
- "Quality Check Passed — Ready for Finishing" → change to "Quality Check Passed — Moved to Stock"
- "Assigned to Finishing" → REMOVE this stage entirely
- "Finishing Done" → REMOVE this stage entirely

**Update the Production Stats Strip:**

- Remove "Sarees Ready for Finishing" column
- Replace with "Sarees in Stock — Ready for Sale" — shows count of QC-passed sarees now in inventory

**Update batch card status badges:**

- Remove "✓ Assign Finishing" green button from all cards
- QC Passed cards now show: "✓ In Stock — Ready for Sale" — green badge
- No action button needed on these cards since finishing happens post-sale

**Update Stage Funnel Chart in Production Analytics:**
Remove "Assigned to Finishing" and "Finishing Done" stages
Add "In Stock — Ready for Sale" as the stage after QC Passed

---

## CORRECTION 5 — STOCK PAGE AFTER QC — New Stock Section on Production Page

After QC Passed sarees move to stock — add a new section on the Production page:

**Section title:** `|` "Sarees in Stock — Quality Check Passed" + "View All Stock →" gold right link

**Sub-label:** "These sarees have passed quality check and are now in stock. They will be sent for finishing only after a confirmed sale or order." — DM Sans 13px muted

**Each saree record in stock shows full details:**
Card or table row per saree showing:

- Saree ID: DM Mono 12px burgundy — format depends on source (see Correction 7)
- Barcode visual: small barcode image strip
- Source: "Own Factory · Loom 3" OR "Outsourced · Ravi Kumar (WV-001)" — tagged clearly
- Weaver/Loom: name or loom number
- Weight: "842 grams" — DM Sans 13px
- QC Date: "Passed on 11 Jun 2026" — DM Sans 12px muted
- Design Code: DM Mono 11px burgundy
- Saree Type: "HZ-003 · Heavy Zari" — DM Mono chip
- Status: "✓ In Stock — Available for Sale" — green badge

---

## CORRECTION 6 — ASSIGN TO FINISHING MOVES TO SALES/DISPATCH — Dispatch Section

On the Dispatch section (wherever dispatch/sales happens in the dashboard):

Add "Assign to Finishing" workflow here:

When a sale is confirmed or a wholesale dispatch is being processed:

- System shows the sarees being sold/dispatched
- A button appears: "✂ Assign to Finishing Before Dispatch" — burgundy filled
- Clicking this triggers the finishing assignment to Finishing Staff
- Finishing Staff portal then shows: "Sarees Sold — Send to Finishing"
Not "QC Passed — Ready for Finishing" as before

**Update Finishing Staff portal notification language everywhere:**

- "Sarees Sold — Send to Finishing" not "QC Passed — Ready for Finishing"
- "These sarees have been sold. Please complete finishing and packaging before dispatch." — plain language description

---

## CORRECTION 7 — TWO PRODUCTION SOURCES — Tag Every Saree

**Add production source tagging throughout the system:**

**Source 1 — Own Factory:**

- Tag: "🏭 Own Factory" — dark badge with factory icon
- Record: Loom Number (example: Loom 3)
- Saree ID format: BKB-L3-001 (Factory short code + L + Loom number + sequence)
- On batch cards and saree records — show "Own Factory · Loom 3"

**Source 2 — Outsourced Weaver:**

- Tag: "🪡 Outsourced" — gold badge with thread icon
- Record: Weaver first name + Loom number + weaver code
- Saree ID format: RAVI-L2-001 (Weaver first name + L + Loom number + sequence)
- On batch cards and saree records — show "Outsourced · Ravi Kumar · WV-001"

**Where to show the production source tag:**

- Every batch card — top right area alongside existing status badge
- Every saree record in stock — as a prominent tag
- Every row in the production history table — as a column "Source"
- Every QC record — showing which source the saree came from

**Reports page — Production Report:**
Add a new chart: "Own Factory vs Outsourced Production"
Two bars or donut showing how many sarees came from each source this period
Also add a filter: "All Sources" · "Own Factory Only" · "Outsourced Only"

Add a new column in the Production History table:
"Source" — "Own Factory · L3" or "Outsourced · Ravi Kumar"

---

## CORRECTION 8 — SIX FIRMS FOR BILLING — Payments Page

**Add firm selection to every payment transaction:**

In the Payments page — every payment entry (weaver payment, vendor payment, any outgoing payment) must include:

A "Pay From Firm" dropdown:

- Label: "Select Firm Making This Payment" — DM Sans 500 14px
- Dropdown shows 6 firm names (added by superadmin — names shown as entered)
- This field is mandatory — payment cannot be recorded without selecting a firm
- Selected firm is stored against every payment record

**Add a new "Firm-wise Payment Summary" section on the Payments page:**

Section title: `|` "Firm-wise Payment Summary" + "Download Firm Report →" gold right link

Sub-label: "Shows how much was paid from each of the 6 firms. All payments are recorded under the firm that made them." — DM Sans 13px muted

6 cards in a row — one per firm:
Each card:

- Firm name: Playfair Display 600 16px dark
- "Total paid this month:" — amount Playfair Display 700 24px gold
- "Total paid all time:" — amount DM Sans 13px muted
- "Number of payments:" — DM Mono 11px muted
- "View Ledger →" gold link

**In every payment record/row across the Payments page:**
Add a "Paid From Firm" column showing which firm made that payment — DM Mono 11px burgundy chip

**In the Payment History table:**
Add column: "Firm" — shows firm name as a small DM Mono chip

---

## CORRECTION 9 — BULK ORDER PAYMENT ALERTS — Day 45

**Change the payment alert trigger from 60–90 days to starting from Day 45:**

On the Payments page — Wholesale Customer section:

- Alert strip and overdue indicators now trigger from Day 45 after dispatch
- Update all due date calculations: "Alert from Day 45" not "Due at 60 days"
- Daily WhatsApp reminders start from Day 45
- Payment status labels:

Day 1–44: "○ Awaiting Payment — Within Terms" — gray
Day 45–59: "⚠ Follow Up Now — 45+ days pending" — gold badge
Day 60+: "🔴 Overdue — Immediate Action Needed" — crimson badge

Update the overdue alert strip on the Payments page to reflect this new timing.

On the Reports page — Overdue & Alerts tab:
Update the alert timing language from "60–90 days" to "45+ days"

---

## CORRECTION 10 — WEAVER REGISTRATION FIELDS — Weavers Page

**Add two new mandatory fields to the Add New Weaver form:**

**Field 1 — Weaver Photo:**

- Label: "Photo of Weaver" — DM Sans 600 14px
- Sub: "Upload a clear photo of the weaver's face to identify them easily. This photo will appear on their profile and batch records." — DM Sans 12px muted
- Upload area: circular crop preview — 120px diameter
- Camera icon with "Upload Photo" text — or "Take Photo" on mobile
- Accepted: JPG/PNG up to 5MB
- Mandatory — form cannot be submitted without photo

**Field 2 — Email ID:**

- Label: "Email ID" — DM Sans 600 14px
- Sub: "Used for records and notifications." — DM Sans 12px muted
- Standard email input
- Mandatory field

**Field 3 — Name split into First Name + Last Name:**

- Replace single "Full Name" field with two separate fields:
    - "First Name *" — text input
    - "Last Name *" — text input
- Note below: "The weaver will be identified by their first name in all batch IDs and saree records." — DM Sans 11px muted

**Update weaver profile cards everywhere:**

- Show weaver photo in the circular avatar area — replacing the initials circle if photo is uploaded
- If no photo: show initials as fallback
- Weaver card in Active Weavers section on Overview page — show photo
- Weaver cards on Weavers page — show photo
- Weaver cards in "Material Given to Weavers" on Materials page — show photo

---

## CORRECTION 11 — BATCH ID AND SAREE ID FORMAT CHANGES

**Vendor Raw Material Batch IDs:**
Old format: WRP-20260428-003 or RSM-RED-001
New format: [VendorFirstName]-[MaterialType][Grade][Color]-[SEQ]

Examples:

- Sri Venkateswara Textiles → first name "Sri" → SRI-WARP-001
- Lakshmi Thread House → first name "Lakshmi" → LAKSH-WARP-001
- Kanchipuram Silks → first name "Kanchipuram" → KANCH-RESH-RED-001
- Surat Zari Works → first name "Surat" → SURAT-PLY2GGOLD-001

The vendor's first name (first word of vendor name) is used as the prefix.
Short name is auto-generated from the first word of the vendor name — truncated to 5 characters maximum if long.

**Weaver Saree IDs (Outsourced):**
Old format: SAR-BKB045-WV002-0087
New format: [WeaverFirstName]-L[LoomNumber]-[SEQ]

Examples:

- Ravi Kumar on Loom 2 → RAVI-L2-001
- Padma Veni on Loom 1 → PADMA-L1-001
- Suresh Murti on Loom 2 → SURESH-L2-001

**Own Factory Saree IDs:**
Format: BKB-L[LoomNumber]-[SEQ]

Examples:

- Own factory Loom 3 → BKB-L3-001
- Own factory Loom 1 → BKB-L1-001

**Update all batch ID and saree ID displays across all pages:**

- Materials page batch table — all batch IDs update to new format
- Production page batch cards — all batch numbers update
- Weavers page — batch numbers in cards and table update
- QC records — saree IDs update
- Stock records — saree IDs update
- Payment records — batch references update
- History table — all IDs update

---

## CORRECTION 12 — SAREE BARCODE AND QR CODE — Barcode Label Design

**Update the saree barcode label design:**

The printed label on each saree must contain:

Top line: "Beere Kesava & Brothers Silks · Est. 1999" — small, DM Sans, firm branding

Barcode: Standard linear barcode (Code 128) — machine printable, scanner readable
Below barcode: Saree ID in DM Mono — "RAVI-L2-001"

Details printed below barcode in two lines:
Line 1: Weaver first name + "·" + Weight in grams
Example: "Ravi · 842g"
Line 2: Design code + Saree type
Example: "BKB-045 · Heavy Zari"

QR Code: Add a QR code alongside the linear barcode — smaller, for phone scanning
When QR code is scanned on phone — shows all saree details:

- Saree ID
- Weaver full name and code
- Weight
- Design code and name
- Saree type
- QC date and result
- Batch ID
- Firm: Beere Keshava & Brothers Silks

**Show the updated barcode label design in the Materials page and Production page wherever barcode labels are shown or referenced.**

---

## CORRECTION 13 — DESIGN LIBRARY IN WEAVER PORTAL

**Add Design Library section to the Weaver Portal:**

The Weaver portal currently shows: My Batches · Confirm Receipt · Color Slip · Warp Request · Payment Ledger · Notifications

Add a new section: "Design Library" — view only

**Design Library in Weaver Portal:**

- Weaver can browse all design codes and their color slip photos
- Weaver can view design graphs if uploaded
- View only — no upload, no edit, no delete access
- Search by design code or design name
- Filter: "Currently in production" · "All designs"

Each design card in the weaver portal shows:

- Design code: DM Mono 14px burgundy
- Color slip photo — full card top
- Design name: Playfair Display 600 14px
- Saree type chip
- "Currently being used: Yes/No" indicator

Simple, clean, mobile-optimized layout — 2 column grid on phone.

---

## CORRECTION 14 — MATERIALS PAGE — STOCK MOVEMENT UNIT UPDATE

On the Full Movement History section of the Materials page:

**Update all Jari movement entries:**

- "50 kg Jari received" → "12 Buns (48 Reels) Jari received"
- "6 kg Jari issued to weaver" → "6 Reels Jari issued to weaver"

Bar chart "Stock Coming In vs Going Out":

- Jari bars now show Buns on Y axis not kg
- Y axis label: "Buns" for Jari chart

Summary numbers for Jari:

- "Total received: 36 Buns (144 Reels)"
- "Total given to weavers: 28 Reels (7 Buns)"
- "Currently in factory: 116 Reels (29 Buns)"

---

## CORRECTION 15 — REPORTS PAGE — JARI IN REPORTS

On the Reports page — Raw Material Report tab:

**Update all Jari data:**

- Change unit from kg to Buns/Reels throughout
- Column header: "Amount (Buns / Reels)" not "Amount (kg)"
- Each Jari row shows: "8 Buns (32 Reels)"
- Add Jari color breakdown rows — one row per color

Add Jari color breakdown table within the Raw Material Report:
Sub-section: "Jari Stock by Color"
Columns: Color · Type · Grade · Opening Stock (Buns) · Received · Given to Weavers · Closing Stock
6 color rows × 2 types × 5 grades shown as expandable grouped rows

---

## CORRECTION 16 — PRODUCTION SOURCE IN ALL REPORTS

On the Reports page — Saree Production Report tab:

**Add new chart:** "Own Factory vs Outsourced Production"
Donut chart: two segments — burgundy (Own Factory) + gold (Outsourced)
Center: total sarees produced
Legend: "Own Factory: X sarees" and "Outsourced (Weavers): Y sarees"

**Add filter to Production Report:**
"All Sources" (active) · "Own Factory Only" · "Outsourced Only"

**Add column to Production History table:**
New column: "Production Source" — "🏭 Own Factory · L3" or "🪡 Outsourced · Ravi Kumar"

---

## FINAL INSTRUCTIONS

Apply all 16 corrections across all 7 admin dashboard pages consistently.

**Do not change:**

- Overall page layouts
- Section ordering (except removals noted above)
- Card design patterns
- Color palette
- Typography system
- Photography style
- Navigation structure (except adding the production source filter)
- Any section not mentioned in this prompt

**Priority order if anything conflicts:**

1. Production flow change takes priority over everything
2. Rough quotation removal is absolute — remove completely
3. Jari unit change applies everywhere without exception
4. Firm name Est. 1999 applies everywhere without exception

**After applying all corrections — verify:**

- No "kg" or "grams" appears anywhere for Jari — only Buns and Reels
- No "Rough Quotation" section exists anywhere
- No "Assign to Finishing" button exists on the Production page
- Every saree is tagged as Own Factory or Outsourced
- Every payment record has a Firm selector
- Est. 1999 appears everywhere instead of Est. 1945
- Weaver photos appear on all weaver cards
- All batch IDs follow the new format

---