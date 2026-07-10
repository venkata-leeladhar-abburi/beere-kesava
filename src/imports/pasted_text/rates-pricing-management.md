Here is the complete Prompt 2 for the Rates & Pricing Management page.

---

## FIGMA MAKE PROMPT 2
### Superadmin Portal — Rates & Pricing Management Page
### Beere Kesava & Brothers Silks ERP · Est. 1999

---

You are designing the **Rates & Pricing Management page** — one of the 3 exclusive Superadmin pages accessed via the "More ⋯" dropdown — for the **Beere Kesava & Brothers Silks ERP (Est. 1999)**. This page does not exist in the Admin portal. It is exclusively for the Superadmin. Attach all existing Superadmin page screenshots as visual reference to match the exact design language.

---

## DESIGN SYSTEM — Apply Exactly

**Colors:**
Background: `#FFFFFF` · Primary burgundy: `#6B1A2A` · Dark section: `#3D0E1A` · Gold: `#C4923A` · Green: `#1E6640` · Crimson: `#C0392B` · Text: `#1A0A0F` · Muted: `#8B7060` · Card border: `rgba(139,26,46,0.12)` · Cream: `#F0E8D0`

**Typography:**
Playfair Display — large numbers and headings
DM Sans — all UI text, labels, descriptions, buttons
DM Mono — all codes, short codes, batch IDs, data labels

**Cards:** White background · `1px solid rgba(139,26,46,0.12)` border · 14–16px border radius · `box-shadow 0 2px 12px rgba(44,24,16,0.07)`

**Section title pattern:** 4px burgundy vertical bar left + DM Sans 600 16px title + gold `#C4923A` DM Sans 500 12px right link

**Buttons:** Always icon + text label together — never icon alone
Edit button style: ghost · `1px solid #6B1A2A` border · `#6B1A2A` text · 10px radius · padding 7px 14px · DM Sans 500 12px
Save button style: `#1E6640` green filled · white text · 999px radius · padding 10px 24px
Cancel button style: ghost · no border · muted text

**Icons:** Use the same dashboard icon set and style already established in the existing Superadmin dashboard pages. Do not introduce new icon styles. Match icon weight, size, and visual language exactly as seen across all existing pages. For every new icon needed, pick the closest matching icon from the same set already used.

---

## NAVIGATION

Active state: "More ⋯" dropdown · "⚙ Rates & Pricing" item highlighted inside dropdown
Gold "SA" avatar circle top right · "Superadmin" text alongside
"More ⋯" button shows dropdown open with three items:
- ⚙ "Rates & Pricing" — highlighted active
- ✓ "Approvals"
- 📋 "Audit Log"

---

## PAGE HEADER — Compact Dark

Full width · Background: `#3D0E1A` · Height: approximately 140px · Same pattern as all other Superadmin pages

**Left side:**
Eyebrow: "SINCE 1999 · SUPERADMIN · RATES & PRICING" — DM Mono 9px · letter-spacing 3px · uppercase · rgba white 50%
Heading: "Rates & Pricing" — Playfair Display 700 42px white
Sub: "& Making Charge Management" — Playfair Display 500 italic 28px gold `#C4923A`
Description: "Set and manage all making charge rates, saree type short codes, retail and wholesale prices, raw material deduction rates, and wholesale payment terms. Only the Superadmin can make changes here." — DM Sans 400 14px rgba white 60% · max-width 520px

**Right side — 3 stat chips (glass style):**
"5 Saree Types Configured"
"Last Rate Change: 3 days ago"
"All Rates Active"

**Decorative:** Two concentric circle outlines bottom right — same as all other page headers

---

## STATS STRIP — Dark Burgundy

Full width dark strip · Same pattern as all other pages · 4 columns with subtle dividers

**Column 1:**
Label: "TOTAL SAREE TYPES CONFIGURED"
Number: "5" — Playfair Display 700 32px white
Below: "All with short codes and rates set"

**Column 2:**
Label: "LAST RATE CHANGE"
Number: "3 days ago" — white Playfair 700 24px
Below: "Self Brocade · ₹420 → ₹450 per saree"

**Column 3 — HIGHLIGHTED GOLD CARD:**
Label: "HIGHEST MAKING CHARGE"
Number: "₹1,200" — dark Playfair 700 32px
Below: "Bridal Special · BS-004 per saree"

**Column 4:**
Label: "LOWEST MAKING CHARGE"
Number: "₹220" — white Playfair 700 32px
Below: "Light Cotton · LC-005 per saree"

---

## SECTION A — MAKING CHARGE RATES

Section title pattern: burgundy bar + "Making Charge Rates — Per Saree Type" + "View Rate Change History →" gold right link

Sub-label: "These rates are paid to weavers as making charges for every saree they produce. The short code is used across the system to identify each saree type. Retail and wholesale prices are also managed here." — DM Sans 13px `#8B7060` · max-width 720px

---

### RATES TABLE

White card · 16px radius · shadow · overflow hidden

**Column headers — DM Mono 9px uppercase letter-spacing 1.5px `#8B7060`:**
Short Code · Saree Type Name · Making Charge Per Saree · Retail Price · Wholesale Price · Standard Weight · Last Changed · Action

**5 data rows:**

Row 1:
- Short Code: "SB-001" — DM Mono 12px `#6B1A2A` burgundy
- Saree Type: "Self Brocade" — DM Sans 600 13px dark
- Making Charge: "₹450 / saree" — Playfair Display 600 16px gold
- Retail Price: "₹8,500" — DM Sans 600 13px dark
- Wholesale Price: "₹7,200" — DM Sans 600 13px dark
- Standard Weight: "850g" — DM Mono 12px muted
- Last Changed: "3 days ago" — DM Sans 12px muted
- Action: "✏ Edit" ghost button

Row 2:
- "HZ-003" · "Heavy Zari" · "₹680 / saree" · "₹12,000" · "₹10,500" · "920g" · "1 week ago" · "✏ Edit"

Row 3:
- "PS-002" · "Plain Silk" · "₹280 / saree" · "₹5,500" · "₹4,800" · "780g" · "2 weeks ago" · "✏ Edit"

Row 4:
- "BS-004" · "Bridal Special" · "₹1,200 / saree" · "₹22,000" · "₹19,500" · "1,050g" · "1 month ago" · "✏ Edit"

Row 5:
- "LC-005" · "Light Cotton" · "₹220 / saree" · "₹4,200" · "₹3,600" · "680g" · "1 month ago" · "✏ Edit"

**Row hover state:** Very subtle cream background `#F0E8D0`

---

### INLINE EDIT FORM — Show open for Row 1 (Self Brocade) as example state

When "✏ Edit" is clicked on any row — this form slides open below that row as an inline panel.

**Form panel design:**
Background: `#F0E8D0` cream · border-top: `2px solid #C4923A` gold · border-radius 0 0 12px 12px · padding 24px · margin: 0 — flush with table row

**Form title row:**
Left: "Editing: Self Brocade — SB-001" — DM Sans 600 14px dark
Right: "× Close" — ghost small button

**Fields in 3-column grid — DM Sans 500 13px labels:**

Column 1:
- "Making Charge Per Saree (₹) *" — number input · large · pre-filled "450" · ₹ prefix inside input
- "Standard Weight (grams) *" — number input · pre-filled "850" · "g" suffix

Column 2:
- "Retail Price Per Saree (₹) *" — number input · pre-filled "8,500"
- "Wholesale Price Per Saree (₹) *" — number input · pre-filled "7,200"

Column 3:
- "Short Code" — DM Mono input · pre-filled "SB-001" · read-only · gray background · note: "Short code cannot be changed"
- "Reason for Change (Optional)" — textarea · 2 rows · "Why are you changing this rate?"

**Warning notice below fields:**
`rgba(196,146,58,0.10)` gold background · `1px solid rgba(196,146,58,0.25)` border · 10px radius · padding 10px 16px
Icon: ⚠ warning icon from dashboard icon set
"Changing the making charge rate will affect all future weaver payment calculations for this saree type. Weavers currently working on this type will see the new rate from their next batch. Past payments will not be affected." — DM Sans 12px `#7A5010` dark gold · line-height 1.5

**Two action buttons:**
"✓ Save Rate Change" — `#1E6640` green filled · 999px radius · padding 10px 28px · DM Sans 600 14px white · icon + text
"× Cancel" — ghost · no border · `#8B7060` muted text · same size

---

### ADD NEW SAREE TYPE — Below the rates table

Full width button spanning table width:
"➕ Add New Saree Type" — `#6B1A2A` burgundy filled · 999px radius · height 48px · DM Sans 600 14px white · icon + text · full width

When clicked — expands a form panel below:

**New Saree Type Form:**
White card · 16px radius · border `1px solid rgba(139,26,46,0.15)` · padding 24px · margin-top 12px

Form title: "Add a New Saree Type" — DM Sans 600 16px dark
Sub: "The short code will be used across all portals to identify this saree type." — DM Sans 12px muted

Fields in 2-column grid:
Column 1:
- "Saree Type Name *" — text input · "Example: Silk Checks"
- "Short Code *" — DM Mono input · "Example: SC-006" · "This code appears on batch cards, weaver portals, and payment records"
- "Standard Weight (grams) *" — number input

Column 2:
- "Making Charge Per Saree (₹) *" — number input · ₹ prefix
- "Retail Price Per Saree (₹) *" — number input
- "Wholesale Price Per Saree (₹) *" — number input

Buttons: "✓ Save New Saree Type" green filled · "× Cancel" ghost

---

## SECTION B — RAW MATERIAL DEDUCTION RATES

Section title pattern: burgundy bar + "Raw Material Deduction Rates" + "View Deduction History →" gold right link

Sub-label: "When a saree weighs more than 600 grams below the standard weight, the cost of the missing raw material is deducted from the weaver's payment. Set the deduction rate per gram or per reel here." — DM Sans 13px muted

---

### THREE DEDUCTION CARDS — side by side

Each card: White background · 16px radius · border · shadow sm · padding 22px · position relative
Top border: 4px solid — burgundy for Warp · gold for Resham · dark `#2C1810` for Jari

**Card 1 — Warp Deduction:**
Icon: appropriate raw material icon from dashboard icon set · 36px · burgundy background circle
Label: "Warp Deduction Rate" — DM Sans 600 14px dark
Current rate — large and prominent:
"₹5.20" — Playfair Display 700 36px dark
"per gram below standard" — DM Sans 13px muted · below the number
Divider
"Applies when saree weight is more than 600g below the standard weight for this design." — DM Sans 12px muted · line-height 1.5
"Last changed: 2 weeks ago" — DM Mono 10px muted · margin-top 8px
"✏ Edit Rate" — ghost burgundy button · full width · icon + text · margin-top 12px

**Card 2 — Resham Deduction:**
Same structure as Card 1
"₹15.00" per gram below standard
"Last changed: 1 month ago"
"✏ Edit Rate"

**Card 3 — Jari Deduction:**
Same structure
"₹42.00" — but label: "per reel below standard" — not per gram
Small note below rate: "Jari is measured in Reels · 1 Bun = 4 Reels" — DM Mono 10px gold background chip
"Last changed: 3 weeks ago"
"✏ Edit Rate"

---

### VARIANCE RULE STRIP — Below the 3 cards

Full width · `#F0E8D0` cream background · 12px radius · padding 16px 22px · border `1px solid rgba(196,146,58,0.20)`

Left side:
Label: "CURRENT VARIANCE RULE" — DM Mono 9px uppercase letter-spacing 2px `#8B7060` · margin-bottom 4px
Rule text: "Up to 600 grams below the standard weight is acceptable. Beyond 600 grams — the deduction rate above is applied per gram of shortage." — DM Sans 500 13px `#1A0A0F`

Right side:
"✏ Edit Variance Rule" — gold `#C4923A` DM Sans 500 12px link · arrow icon

---

### DEDUCTION EDIT FORM — Show for Warp as example

Same inline panel style as Section A edit form · slides open below the Warp card when "✏ Edit Rate" clicked

Fields:
- "Deduction Rate (₹ per gram) *" — number input · pre-filled "5.20"
- "Applies After Variance (grams) *" — number input · pre-filled "600" · "Grams below standard before deduction kicks in"
- "Reason for Change (Optional)" — textarea

Warning: "This change affects all weavers immediately. All future saree weight checks will use the new rate." — DM Sans 12px crimson background `rgba(192,57,43,0.08)` · crimson border · 10px radius · padding 10px 14px

Buttons: "✓ Save Deduction Rate" green filled · "× Cancel" ghost

---

## SECTION C — WHOLESALE PAYMENT TERMS

Section title: burgundy bar + "Wholesale Payment Terms — Per Customer" + "View All Customers →" gold right link

Sub-label: "Set how many days each wholesale customer has to pay after goods are dispatched. Payment alert notifications begin automatically from Day 45 for all customers. Edit each customer's terms here." — DM Sans 13px muted

---

### GLOBAL ALERT SETTING STRIP

Full width · `rgba(196,146,58,0.08)` gold tint background · `1px solid rgba(196,146,58,0.20)` border · 12px radius · padding 14px 20px · margin-bottom 20px

Left: Clock icon from dashboard icon set · "Payment alerts start from: **Day 45** for all customers" — DM Sans 500 13px dark · "Day 45" in bold gold
Right: "✏ Edit Alert Day" — gold link · DM Sans 500 12px

When "✏ Edit Alert Day" clicked — small inline input opens:
"Alert starts from Day:" — number input pre-filled "45" · "✓ Save" green small button · "× Cancel" ghost

---

### PAYMENT TERMS TABLE

White card · 16px radius · shadow

**Column headers — DM Mono 9px uppercase muted:**
Customer Name · Customer Code · Current Terms · Alert Starts · Overdue From · Last Changed · Edit

**8 rows:**

Row 1: Lakshmi Silks · WHL-001 · 30 days · Day 45 · Day 46 · 2 weeks ago · ✏ Edit
Row 2: Narayana Silk Emporium · WHL-002 · 30 days · Day 45 · Day 46 · 1 month ago · ✏ Edit
Row 3: Padmavathi Textiles · WHL-003 · 30 days · Day 45 · Day 46 · 1 month ago · ✏ Edit
Row 4: Vijaya Silk House · WHL-004 · 45 days · Day 45 · Day 46 · 3 weeks ago · ✏ Edit
Row 5: Meenakshi Silks · WHL-005 · 60 days · Day 45 · Day 46 · 2 months ago · ✏ Edit
Row 6: Kalavathi Exports · WHL-006 · 45 days · Day 45 · Day 46 · 1 month ago · ✏ Edit
Row 7: Srinivasa Silks · WHL-007 · 30 days · Day 45 · Day 46 · 2 months ago · ✏ Edit
Row 8: Annapurna Textiles · WHL-008 · 90 days · Day 45 · Day 46 · 3 months ago · ✏ Edit

Customer Code: DM Mono 11px burgundy
Current Terms: DM Mono 12px dark · pill chip `#F0E8D0` background
Alert Starts: DM Mono 11px gold
Overdue From: DM Mono 11px crimson

**Inline edit form for payment terms (show open for Row 1):**
Slides open below the row
Fields: "Payment Terms (Days) *" — number input pre-filled "30" · "Notes (Optional)" — textarea
Buttons: "✓ Save Terms" green · "× Cancel" ghost

---

## SECTION D — JARI MEASUREMENT SETTINGS

Section title: burgundy bar + "Jari Measurement Settings" + "View Jari Stock →" gold right link

Sub-label: "Manage the conversion between Buns and Reels for Jari inventory tracking. This affects all Jari quantities shown across the entire system." — DM Sans 13px muted

---

### MEASUREMENT SETTINGS CARD

White card · 16px radius · shadow · padding 28px

**Current setting — prominent center display:**
"1 Bun = 4 Reels" — Playfair Display 700 40px dark · centered · margin-bottom 8px
"This conversion applies to all Jari types — Polyester and Silk Fast — across all grades and colors." — DM Sans 13px muted · centered · max-width 480px · margin auto

Divider · margin 20px 0

**Editable fields — 3 fields in a row · centered:**
- "1 Bun equals:" label · number input · pre-filled "4" · width 100px · DM Mono · large font
- "Unit name (singular):" label · text input · pre-filled "Reel" · width 160px
- "Unit name (plural):" label · text input · pre-filled "Reels" · width 160px

**Warning below fields:**
`rgba(192,57,43,0.08)` crimson background · crimson border · 10px radius · padding 10px 16px · margin-top 16px
Warning icon from dashboard icon set
"Changing this conversion will update all Jari quantities displayed across the entire system immediately. All stock records, weaver issue records, and reports will reflect the new conversion." — DM Sans 12px `#C0392B` crimson

**Buttons — centered:**
"✓ Save Conversion Settings" — green filled · icon + text
"× Cancel" — ghost

---

## SECTION E — RATE CHANGE HISTORY

Section title: burgundy bar + "Rate Change History — All Changes Ever Made" + "Download History →" gold right link

Sub-label: "Every rate change made by the Superadmin is permanently recorded here. This record cannot be edited or deleted. It is your complete audit trail for all pricing decisions." — DM Sans 13px muted

---

### HISTORY TABLE

White card · 16px radius · shadow

**Column headers — DM Mono 9px uppercase muted:**
Date & Time · Changed By · What Was Changed · Old Value · New Value · Reason

**8 rows — immutable · no edit buttons:**

Row 1: 10 Jun 2026 · 10:24 AM · Superadmin · Self Brocade Making Charge · ₹420/saree (crimson) · ₹450/saree (green) · "Market rate increase"
Row 2: 05 Jun 2026 · 2:15 PM · Superadmin · Heavy Zari Standard Weight · 900g (crimson) · 920g (green) · "Adjusted for new design"
Row 3: 01 Jun 2026 · 11:00 AM · Superadmin · Warp Deduction Rate · ₹4.80/g (crimson) · ₹5.20/g (green) · "Vendor price increase"
Row 4: 28 May 2026 · 3:40 PM · Superadmin · Vijaya Silk House — Payment Terms · 30 days (crimson) · 45 days (green) · "Customer request"
Row 5: 22 May 2026 · 9:00 AM · Superadmin · Bridal Special Retail Price · ₹20,000 (crimson) · ₹22,000 (green) · "Annual price revision"
Row 6: 15 May 2026 · 4:20 PM · Superadmin · Jari Deduction Rate · ₹38/reel (crimson) · ₹42/reel (green) · "Raw material cost increase"
Row 7: 10 May 2026 · 10:05 AM · Superadmin · Light Cotton Making Charge · ₹200/saree (crimson) · ₹220/saree (green) · "Annual revision"
Row 8: 01 May 2026 · 8:30 AM · Superadmin · Meenakshi Silks Payment Terms · 90 days (crimson) · 60 days (green) · "Credit policy review"

**Column styling:**
Date & Time: DM Mono 11px muted
Changed By: DM Sans 600 12px dark
What Was Changed: DM Sans 500 13px dark
Old Value: DM Sans 600 13px `#C0392B` crimson — this was removed
New Value: DM Sans 600 13px `#1E6640` green — this is current
Reason: DM Sans 400 12px muted italic

**Immutable indicator:**
Below table · right aligned:
"🔒 This history is permanent and cannot be edited or deleted." — DM Mono 10px `#8B7060` muted

**Pagination:** Previous · 1 · 2 · 3 · Next — same style as all other tables

---

## FOOTER

Same footer as all other Superadmin pages — Beere Kesava & Brothers Silks · Est. 1999

---

## COMPLETE PAGE SCROLL ORDER

1. Navigation — More ⋯ dropdown active with Rates & Pricing highlighted
2. Page Header — compact dark burgundy
3. Stats Strip — dark 4 columns
4. Section A — Making Charge Rates table with inline edit form shown open for Row 1
5. Section B — Raw Material Deduction Rate cards with variance rule strip
6. Section C — Wholesale Payment Terms with global alert strip and terms table
7. Section D — Jari Measurement Settings card
8. Section E — Rate Change History table
9. Footer

---

## IMPORTANT DESIGN NOTES

**1 — This page is the most important exclusive Superadmin page.** It controls all financial calculations across the entire ERP. Design it to feel authoritative, precise, and serious — but still warm and consistent with the Beere Kesava brand.

**2 — Edit forms feel safe and deliberate.** Every edit form has a warning notice before the save button. This prevents accidental changes. Warning colors are gold for caution, crimson for serious impact.

**3 — History is visually distinct.** The Rate Change History table has no edit buttons anywhere — it looks clearly read-only. Old values in crimson, new values in green. This creates an instant visual understanding of what changed.

**4 — Icons match the dashboard.** Use the same icon set already present in the existing Superadmin dashboard pages. Every icon in this page — edit pencil, save check, cancel cross, warning triangle, lock, clock — must match the dashboard icon style exactly.

**5 — Firm name:** Beere Kesava & Brothers Silks · Est. 1999 — appears in footer and any document references on this page.

---

Paste this prompt into Figma Make and attach all existing Superadmin page screenshots as visual reference. This is Prompt 2 of 4 for the complete Superadmin portal. After this is approved, Prompt 3 covers the Approvals page and Prompt 4 covers the Audit Log page.