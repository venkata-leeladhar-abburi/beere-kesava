## CONFIRMED ANSWERS — SHOP STAFF PORTAL

**Q1 — Assign to Finishing:** Shop staff can directly assign to finishing from their portal — no need to go through admin. They are counter staff related to admin level.

**Q2 — Bill:** Firm name + Saree ID + Design code + Customer name + Date + Price + Payment method. No GST/terms/stamp. Shared via: thermal bill printer at shop + WhatsApp PDF. Both options.

**Q3 — Payment Method:** Cash · UPI · Card · Other — all tracked.

**Q4 — Sarees in Shop:** Dispatched from factory by Finishing Staff via shop dispatch. These appear in shop inventory automatically.

**Q5 — Tablet Layout:** Mobile responsive design for all devices — not a separate tablet layout.

**Q6 — Bill Printer:** Same TSC TE244 thermal printer used at shop for bills.

**Q7 — External Purchase Sarees:** Clearly tagged as "External Purchase" in shop inventory. External purchase sarees also get IDs assigned.

**Q8 — Customer Search:** Auto-fill on search but staff can edit details before confirming.

**Q9 — Low Stock Alert:** One tap sends notification to admin and superadmin both.

**Q10 — Sales Report:** Shop staff sees only their own shop report. Can view on screen — download not mentioned so keep view only.

**Q11 — Return Reasons:** Defective · Wrong Design · Customer Changed Mind · Size/Weight Issue · Other (custom blank field).

**Q12 — External Saree Returns:** Not applicable — BKB only handles returns of sarees sold by BKB. No external saree returns.

---

## ⚠ CROSS-PORTAL IMPACTS

**Impact 1 — Admin Portal:**
Shop staff can now directly assign to finishing — so the "Assign to Finishing" flow in Admin portal is still available but shop staff has parallel access. Admin portal fix prompt needs to note this dual access.

**Impact 2 — Finishing Staff Portal:**
Finishing Staff will now receive finishing assignments from BOTH admin and shop staff. The Finishing Staff home page shows "Assigned Work" — source of assignment (Admin or Shop Staff) should be tagged on each assignment card.

**Impact 3 — Admin Portal — Low Stock Alert:**
When shop staff taps "Report Low Stock to Admin" — admin receives a notification in their portal. Admin portal notification system needs to handle this alert type. Flag for Admin fix prompt.

**Impact 4 — External Purchase IDs:**
External sarees bought from other stores now get IDs assigned when added to shop inventory. ID format needs to confirm — I will use "EXT-[SupplierShortName]-[SEQ]" format example: EXT-RAVI-001. Consistent with the vendor batch ID format established earlier.

---

Now here is the complete Shop Staff portal prompt.

---

## FIGMA MAKE PROMPT

### Shop Staff Portal — All 6 Pages

### Beere Kesava & Brothers Silks ERP · Est. 1999

---

You are designing the complete **Shop Staff Portal** — a mobile-responsive portal for retail shop counter staff — for the **Beere Kesava & Brothers Silks ERP (Est. 1999)**. Design all 6 pages. The portal must be fully responsive — works on all screen sizes from 390px phone to tablet to desktop. All content and interactions are the same across all sizes — use responsive layout only, not separate designs.

**CRITICAL STYLE INSTRUCTION:**
This portal must match the Admin and Superadmin dashboard design style exactly. Same burgundy `#6B1A2A` + gold `#C4923A` + white color system. Same Playfair Display + DM Sans + DM Mono typography. Same dark compact page headers with gold eyebrow text. Same dark stats strips. Same white card patterns with subtle borders and soft shadows. Same section title pattern — burgundy vertical bar + DM Sans 600 + gold right link. Same button style — icon + text always. This is a premium silk brand — every screen must feel that way.

Attach all existing Admin, Superadmin, Worker Staff, Finishing Staff, and Weaver portal screenshots as reference.

---

## DESIGN SYSTEM — Apply Exactly

**Colors:**
Background: `#FFFFFF` · Burgundy: `#6B1A2A` · Dark: `#3D0E1A` · Gold: `#C4923A` · Green: `#1E6640` · Crimson: `#C0392B` · Text: `#1A0A0F` · Muted: `#8B7060` · Border: `rgba(139,26,46,0.12)` · Cream: `#F0E8D0` · Input: `#FFF8E7`

**Typography:**
Playfair Display 700 — headings and large numbers
Playfair Display 500 italic — sub-headings in gold
DM Sans 400/500/600 — all UI text minimum 14px
DM Mono 500 — all codes, IDs, amounts, barcodes

**Responsive layout:**
Mobile 390px — single column · bottom tab bar navigation
Tablet 768px — same content · slightly wider cards · 2 column grid where appropriate
Desktop 1280px+ — full width · top navigation bar · multi-column sections

**Cards:** White · `1px solid rgba(139,26,46,0.12)` border · 14–16px radius · `box-shadow 0 2px 12px rgba(44,24,16,0.07)`

**Inputs:** 52px height · `#FFF8E7` background · 12px radius · label always above

**Buttons:** 52px height · icon + text always · 999px radius primary · DM Sans 600 14px

**Icons:** Same dashboard icon set across all portals — no new styles

---

## NAVIGATION

**Mobile — Bottom Tab Bar:**
Height 64px · white · top border · 5 tabs:
🏠 "Home" · 🛍 "New Sale" · 📦 "Inventory" · 👤 "Customers" · 📊 "Reports"

Active: burgundy icon + label + 2px top border
Unread badge: red dot on relevant tabs

**Mobile — Global Header:**
56px · burgundy `#6B1A2A` · left: logo mark white · center: page title Playfair 600 17px white · right: bell icon white with badge

**Desktop/Tablet — Top Navigation Bar:**
Same pattern as Admin dashboard top nav
Left: Beere Kesava & Brothers Silks logo + Est. 1999
Center tabs: Home · New Sale · Inventory · Customers · Reports
Right: Search · Bell · "SS · Shop Staff" avatar — teal circle to distinguish from other roles

---

## PAGE 01 — SHOP HOME

Tab active: Home

---

**PAGE HEADER — Compact Dark:**
Background: `#3D0E1A`
Eyebrow: "SINCE 1999 · SHOP OVERVIEW" — DM Mono 9px uppercase rgba white 50%
Heading: "Shop Home" — Playfair Display 700 36px white
Sub: "& Today's Overview" — Playfair Display 500 italic 22px gold
Description: "Today's sales, current inventory, and quick actions for the shop counter." — DM Sans 14px rgba white 60%

**Right side stat chips (desktop) / below heading (mobile):**
"Today: X sales" · "₹X revenue today" · "X sarees in shop"

---

**STATS STRIP — Dark burgundy:**
4 columns same pattern as Admin

Column 1: "TODAY'S SALES" · "12 sarees" · Playfair 700 28px white · "↑ 3 more than yesterday"
Column 2: "TODAY'S REVENUE" · "₹1,04,000" · white · "From 12 sales"
Column 3 — GOLD HIGHLIGHT: "SHOP INVENTORY" · "84 sarees" · dark Playfair 700 28px · "Currently in stock"
Column 4: "RETURNS TODAY" · "1 return" · white · "Processed and recorded"

---

**QUICK ACTION — NEW SALE BUTTON:**

Full width prominent card — immediately below stats strip
`rgba(139,26,42,0.06)` subtle tint background · 2px solid `#6B1A2A` border · 16px radius · padding 20px · margin 16px 20px

Left: shopping bag icon 40px · gold background circle 56px
Right of icon: "New Retail Sale" Playfair Display 600 20px dark · "Tap to record a sale at the counter" DM Sans 13px muted
Far right: "→ Start New Sale" burgundy filled button · 999px radius · 48px height · icon + text

This is the most used action — must be instantly visible without scrolling.

---

**RECENT SALES LIST:**

Section title: burgundy bar + "Recent Sales — Today" + "View All →" gold right link

5 recent sale rows · white card per row · padding 14px 16px · border-bottom `rgba(139,26,46,0.08)` · flex row

Each row:
Left: saree color indicator square 8px × 32px · rounded — shows saree color
Center: Saree ID DM Mono 12px burgundy · customer name DM Sans 600 13px dark below · design DM Sans 12px muted
Right: amount Playfair Display 600 16px gold · time DM Mono 10px muted below

5 sample rows:
PADMA-L1-004 · Smt. Annapurna · BKB-045 · ₹8,500 · 11:42 AM
RAVI-L2-008 · Sri Ramesh K. · BKB-031 · ₹12,000 · 10:30 AM
BKB-L3-002 · Smt. Lakshmi · BKB-022 · ₹5,500 · 9:45 AM
EXT-RAVI-001 · Smt. Padmavathi · External · ₹6,200 · 9:20 AM · "External" gold chip
PADMA-L1-003 · Smt. Saraswathi · BKB-045 · ₹8,500 · Yesterday · 4:30 PM

---

**RETURNS PROCESSED TODAY:**

Section title: burgundy bar + "Returns Today"

If returns exist — compact cards same as sales list but crimson left border + "↩ Return" badge
If no returns — small note: "No returns processed today" DM Sans 13px muted

---

**LOW STOCK ALERT (if applicable):**

Section title: burgundy bar + "Stock Alert"

Full width alert card · crimson left border 4px · `rgba(192,57,43,0.06)` background · padding 16px 18px
"⚠ Shop stock is running low — only 12 sarees remaining." — DM Sans 500 14px dark
"📢 Report Low Stock to Admin" — burgundy filled button · full width · 48px height · icon + text
After tap: "✓ Admin and Superadmin have been notified about low stock." — green confirmation

---

## PAGE 02 — NEW RETAIL SALE

Tab active: New Sale

**Most important page — must feel fast, clear, and error-proof.**

---

**PAGE HEADER — Compact Dark:**
Eyebrow: "SINCE 1999 · NEW SALE"
Heading: "New Retail Sale" — Playfair Display 700 36px white
Sub: "Record a sale at the shop" — Playfair Display 500 italic 22px gold

---

**STEP 1 — SCAN OR ENTER SAREE:**

Section label: "Step 1 — Which saree is being sold?" — DM Sans 600 14px burgundy

**Large scan button — primary action:**`#6B1A2A` burgundy card · 100px height · 16px radius · center aligned · margin 0 20px
Camera icon 36px white · "📷 Scan Saree Barcode" — DM Sans 600 16px white · centered
Sub: "Point camera at the barcode tag on the saree" — DM Sans 12px rgba white 60%

Manual entry option below: "Or enter Saree ID manually" — DM Sans 13px gold link · tap opens DM Mono text input

---

**AFTER SCAN — SAREE DETAILS AUTO-FILL:**

Saree info card — slides in:
White card · 16px radius · border · shadow · padding 18px · margin 0 20px

Green checkmark header: "✓ Saree Found" — DM Sans 600 13px green

Details grid — 2 column:
Left labels DM Sans 500 12px muted · Right values DM Sans 600 14px dark / DM Mono for codes

Saree ID: "PADMA-L1-004" — DM Mono 600 16px burgundy · large
Design Code: "BKB-045" — DM Mono 12px
Design Name: "Cream Zari Border Saree" — DM Sans 600 14px
Saree Type: "Self Brocade · SB-001" — DM Mono chip gold
Weight: "842 grams" — DM Mono 12px
Weaver: "Padma Veni" — DM Sans 13px
Source badge: "🏭 From Factory" green OR "📦 External Purchase" gold — prominent

**Retail Price — very large and prominent:**
"Retail Price:" — DM Sans 500 13px muted
"₹8,500" — Playfair Display 700 36px gold · centered · cannot be edited by shop staff

---

**STEP 2 — PAYMENT METHOD:**

Section label: "Step 2 — How is the customer paying?" — DM Sans 600 14px burgundy

4 payment method cards in 2×2 grid:
Each card: white · 12px radius · border · padding 14px · center aligned · 72px height
Icon 24px + label DM Sans 600 14px dark

💵 "Cash" · 📱 "UPI" · 💳 "Card" · ➕ "Other"

When selected: burgundy border 2px · `rgba(139,26,46,0.06)` background · gold checkmark top right

If UPI selected: small input appears: "UPI Reference Number (Optional)" — DM Mono input
If Card selected: "Last 4 digits of card (Optional)" — DM Mono input
If Other selected: "Payment details" — text input

---

**STEP 3 — CUSTOMER DETAILS:**

Section label: "Step 3 — Customer Details" — DM Sans 600 14px burgundy

**Phone number search first:**
Label: "Customer's Phone Number" — DM Sans 500 14px dark
Input: 52px · number · DM Mono 16px · `#FFF8E7` · "Search by phone number..."
After entering phone: system searches existing customers

**If existing customer found:**
Green strip: "✓ Customer Found — Details filled automatically" — DM Sans 500 12px green
All fields auto-filled below — staff can edit before confirming

**If new customer:**
Gold strip: "New Customer — Please fill in details" — DM Sans 500 12px gold

**Customer form fields:**

- "Customer Name *" — text input · 52px
- "Phone Number *" — number input · DM Mono · auto-filled from search
- "Address (Optional)" — textarea · 2 rows · "Door number, street, city"

Note below form: "A customer profile will be created or updated automatically after this sale." — DM Sans 12px muted italic

---

**STEP 4 — CONFIRM SALE:**

Section label: "Step 4 — Confirm Sale" — DM Sans 600 14px burgundy

**Sale summary card:**`#F0E8D0` cream · 14px radius · border gold · padding 18px · margin 0 20px

Summary rows — label left · value right:
Saree: "PADMA-L1-004 · BKB-045"
Customer: "Smt. Annapurna · +91 98765 43210"
Amount: "₹8,500" — Playfair Display 700 24px gold · right
Payment: "UPI" — DM Mono chip

**Large confirm button:**
"✓ Confirm Sale — Generate Bill" — `#1E6640` green filled · full width minus 40px · 56px height · 999px radius · DM Sans 600 16px white · icon + text

---

**SUCCESS STATE — BILL GENERATED:**

Full page success overlay:

Green checkmark circle 64px · centered
"Sale Confirmed!" — Playfair Display 700 28px dark · centered
"Bill has been generated." — DM Sans 14px muted

**Bill preview card:**
White card · 14px radius · border · padding 20px · margin 16px 20px · subtle shadow
Header: "Beere Kesava & Brothers Silks · Est. 1999" — Playfair Display 600 16px burgundy · centered
Line divider
Saree ID: DM Mono 12px · Design: DM Sans 13px · Customer: DM Sans 13px · Date + Time: DM Mono 11px muted · Amount: Playfair Display 700 24px gold · Payment method: DM Mono chip

**Two action buttons:**
"🖨 Print Bill" — burgundy filled · full width minus 40px · 56px height · "Prints to shop bill printer"
"📲 Send to Customer on WhatsApp" — green filled · full width minus 40px · 52px height · below

**Assign to Finishing — appears here after sale confirmed:**

Gold card below bill buttons:
`rgba(196,146,58,0.12)` background · gold border · 14px radius · padding 16px 18px · margin 0 20px
"✂ This saree needs finishing before it can be given to the customer."
DM Sans 500 14px dark · line-height 1.5
"Assign to Finishing Staff Now" — gold filled button · full width · 48px height · icon + text · `#C4923A` gold background · dark text

After assigning: "✓ Assigned to Finishing Staff — they will be notified immediately." — green strip

**Record Next Sale button:**
"➕ Record Another Sale" — ghost burgundy · full width minus 40px · 52px height · below all buttons

---

## PAGE 03 — SHOP INVENTORY

Tab active: Inventory

---

**PAGE HEADER — Compact Dark:**
Eyebrow: "SINCE 1999 · SHOP INVENTORY"
Heading: "Shop Inventory" — Playfair Display 700 36px white
Sub: "Current stock in the shop" — Playfair Display 500 italic 22px gold

**Stats strip — 3 columns:**
Column 1: "TOTAL SAREES IN SHOP" · "84 sarees" · white large
Column 2 — GOLD: "AVAILABLE FOR SALE" · "76 sarees" · dark large
Column 3: "LOW STOCK THRESHOLD" · "Below 15 — Alert Active" · crimson

---

**FILTER AND SEARCH BAR:**

White card · padding 14px 16px · margin 16px 20px · border · 14px radius

Search: 🔍 "Search by Saree ID, design code, or color..." — DM Sans 14px · full width · 44px height

Filter pills row — horizontal scroll:
"All Sarees" (active) · "From Factory" · "External Purchase" · "Design: BKB-045" · "Color: Cream" · "Received This Week"

Sort: "Sort By: Newest First ▾"

Results count: "Showing 84 sarees · 76 available · 8 reserved" — DM Mono 11px muted

---

**INVENTORY LIST:**

Each saree row — white card · margin 0 20px 10px · 14px radius · border · shadow sm · padding 16px

Row layout:
Left: color indicator bar 6px × full height · colored per saree color
Content:
Top row: Saree ID DM Mono 13px burgundy + source badge right
Source badge: "🏭 Factory" green pill OR "📦 External" gold pill

Details row:
Design: "BKB-045 · Cream Zari Border" — DM Sans 600 14px dark
Color: "Cream" · Saree Type: "Self Brocade" — DM Sans 12px muted

Price row:
"Retail Price: ₹8,500" — Playfair Display 600 18px gold

Received row:
"Received: 10 Jun 2026 · From factory dispatch" — DM Sans 12px muted

Status badge:
"✓ Available" green · "Reserved for Customer" gold · "On Hold" muted

**For External Purchase sarees — additional row:**
"Supplier: Ravi Silks (EXT-RAVI-001) · Purchased: 05 Jun 2026" — DM Sans 12px muted
External ID: "EXT-RAVI-001" — DM Mono 11px gold chip

**Sample inventory rows — 6:**

Row 1: PADMA-L1-004 · 🏭 Factory · BKB-045 · Cream Zari · ₹8,500 · Received 10 Jun · ✓ Available
Row 2: RAVI-L2-008 · 🏭 Factory · BKB-031 · Maroon Heavy · ₹12,000 · Received 09 Jun · ✓ Available
Row 3: BKB-L3-002 · 🏭 Factory · BKB-022 · Cream Plain · ₹5,500 · Received 08 Jun · ✓ Available
Row 4: EXT-RAVI-001 · 📦 External · External Purchase · Silk Checks · ₹6,200 · Purchased 05 Jun · ✓ Available · Supplier: Ravi Silks
Row 5: EXT-RAVI-002 · 📦 External · External Purchase · Floral Design · ₹7,800 · Purchased 05 Jun · ✓ Available
Row 6: PADMA-L1-003 · 🏭 Factory · BKB-045 · Cream Zari · ₹8,500 · Received 07 Jun · Reserved for Customer

---

**LOW STOCK NOTICE — at bottom of inventory:**

If total sarees below threshold:
Crimson card full width · padding 16px 18px · 14px radius · margin 0 20px
"⚠ Only 84 sarees in stock. Stock is below the alert threshold."
"📢 Report to Admin" — burgundy filled button · full width · 48px height

---

## PAGE 04 — PROCESS RETURN

Tab active: accessed via hamburger or separate flow from Home

---

**PAGE HEADER — Compact Dark:**
Eyebrow: "SINCE 1999 · PROCESS RETURN"
Heading: "Process Return" — Playfair Display 700 36px white
Sub: "Handle customer returns" — Playfair Display 500 italic 22px gold

---

**STEP 1 — SCAN BARCODE:**

Large scan card · full width · burgundy background · 100px height · center aligned
"📷 Scan Saree Barcode to Find Original Sale" — DM Sans 600 16px white
Sub: "Point camera at the barcode on the saree tag" — DM Sans 12px rgba white 60%

Manual entry: "No barcode? Enter Saree ID manually" — gold link below

---

**AFTER SCAN — ORIGINAL SALE FOUND:**

Green strip: "✓ Original Sale Found"

Sale record card · white · 16px radius · border · padding 18px

Saree ID: DM Mono 600 16px burgundy
Design: DM Sans 600 14px
Original Sale Date: DM Mono 12px muted
Original Customer: DM Sans 600 14px dark
Amount Paid: Playfair Display 600 20px gold
Payment Method: DM Mono chip

---

**IF BARCODE MISSING — Manual Return Entry:**

Manual return form:

- "Customer Name" — text input
- "Customer Phone" — number input · searches existing customers
- "Saree Description" — textarea
- "Approximate Purchase Date" — date picker
- "Amount Paid (Approximate)" — number input

---

**STEP 2 — RETURN REASON:**

Section label: "Why is the customer returning this saree?" — DM Sans 600 14px burgundy

5 reason cards in grid:
Each card: white · 12px radius · border · padding 12px · center aligned · 60px height
Tap to select · selected: burgundy border + gold checkmark

"🔴 Defective" · "🎨 Wrong Design" · "💭 Changed Mind" · "⚖ Size/Weight Issue" · "📝 Other"

If "Other" selected: text input appears · "Describe the reason..." · DM Sans 14px

---

**STEP 3 — CONFIRM RETURN:**

Return summary card:
`#F0E8D0` cream · padding 16px · 12px radius
Saree · Customer · Original sale date · Return reason
"Shop inventory will increase by 1 after confirming." — DM Sans 12px muted

"✓ Confirm Return" — crimson filled `#C0392B` · full width minus 40px · 56px height · 999px radius · DM Sans 600 16px white

---

**SUCCESS STATE:**

Red-tinted checkmark (return indicator)
"Return Processed" — Playfair Display 600 22px dark
"PADMA-L1-004 has been returned. Shop inventory updated. Customer profile updated." — DM Sans 14px muted
Return reference: DM Mono 12px burgundy chip

---

## PAGE 05 — CUSTOMER PROFILES

Tab active: Customers

---

**PAGE HEADER — Compact Dark:**
Eyebrow: "SINCE 1999 · CUSTOMER PROFILES"
Heading: "Customer Profiles" — Playfair Display 700 36px white
Sub: "All retail customers" — Playfair Display 500 italic 22px gold

**Stats strip — 3 columns:**
"TOTAL CUSTOMERS" · "1,284" · white large
"NEW THIS MONTH" · "8" · gold highlight
"TOP SPENDER" · "Smt. Annapurna · ₹1,84,000" · white

---

**SEARCH AND FILTER:**

Search: "🔍 Search by name or phone number..."
Sort pills: "All" · "Highest Spend" · "Most Frequent" · "Recent Visit" · "Has Returns"

---

**CUSTOMER CARDS — responsive grid:**
Mobile: 1 column · Tablet: 2 columns · Desktop: 3 columns

Each customer card:
White · 14px radius · border · shadow sm · padding 18px

Top row: Avatar circle 48px (initials · burgundy bg) · Name Playfair 600 16px dark · "Regular" gold star badge if 3+ purchases

Contact: 📱 phone number DM Mono 12px muted (masked last 4)

3 stat chips in a row:
"X purchases" · "₹X total" · "Last: X days ago"

"View Purchase History →" gold link · full width · text only

---

**CUSTOMER DETAIL — opens on tap:**

Full page or modal depending on screen size

**Customer name header** — dark burgundy · Playfair 700 22px white

**Purchase history table:**
Date · Saree ID (DM Mono burgundy) · Design · Price DM Mono gold · each row

**Returns section:**
Each return — crimson left border · date · reason · saree ID

**Frequency analysis:**
"Visits per month: 1.5 average" · "Last visit: 3 days ago" · "Preferred design: BKB-045" — DM Sans 13px muted

---

**SAMPLE CUSTOMER CARDS — 6:**

Card 1: Smt. Annapurna Devi · ×××× 7823 · 18 purchases · ₹1,84,000 · Last: 3 days ago · ⭐ Regular
Card 2: Smt. Lakshmi Bai · ×××× 3412 · 12 purchases · ₹1,62,000 · Last: 1 week ago · ⭐ Regular
Card 3: Sri Ramesh K. · ×××× 4421 · 4 purchases · ₹48,000 · Last: 2 weeks ago
Card 4: Smt. Padmavathi · ×××× 9981 · 1 purchase · ₹12,500 · Last: Today
Card 5: Smt. Saraswathi · ×××× 6634 · 7 purchases · ₹84,000 · Last: 5 days ago · ⭐ Regular
Card 6: Smt. Rajeshwari · ×××× 2218 · 2 purchases · ₹28,000 · Last: 6 months ago

---

## PAGE 06 — SALES REPORT

Tab active: Reports

---

**PAGE HEADER — Compact Dark:**
Eyebrow: "SINCE 1999 · SALES REPORT"
Heading: "Sales Report" — Playfair Display 700 36px white
Sub: "Daily and monthly overview" — Playfair Display 500 italic 22px gold
Description: "This report is also visible to Admin and Superadmin." — DM Sans 13px rgba white 55%

**Period toggle — below header on white:**
"Today" (active) · "This Week" · "This Month" · "Last 3 Months"

---

**STATS STRIP:**
Column 1: "SAREES SOLD TODAY" · "12" · white
Column 2: "REVENUE TODAY" · "₹1,04,000" · white
Column 3 — GOLD: "THIS MONTH REVENUE" · "₹18,40,000" · dark large
Column 4: "RETURNS THIS MONTH" · "3 returns" · crimson

---

**DAILY SALES SUMMARY:**

Section title: burgundy bar + "Today's Sales — 13 Jun 2026"

Table — white card:
Columns: Time · Saree ID · Design · Customer · Payment · Amount

12 rows · paginated · same styling as other tables
Amount column: DM Mono 14px gold · right aligned
Source tag on each row: "Factory" green chip or "External" gold chip

Total row at bottom: cream background · "Total: ₹1,04,000" Playfair 600 18px gold right

---

**MONTHLY TOTALS:**

Section title: burgundy bar + "This Month — Jun 2026"

2 column stats:
Left column: "Total Sales: 248 sarees" · "Revenue: ₹18,40,000" · "Average per sale: ₹7,419"
Right column: "Returns: 3 sarees" · "Net Revenue: ₹18,18,000" · "Most sold: BKB-045"

---

**TOP CUSTOMERS THIS MONTH:**

Section title: burgundy bar + "Top 5 Customers This Month"

5 rows — rank number left · customer name · purchases · amount
Rank 1: gold Playfair 700 24px number · Rank 2-5: dark Playfair 600 20px

---

**DESIGN-WISE SALES BREAKDOWN:**

Section title: burgundy bar + "Sales by Design"

Horizontal bar chart — same style as Admin dashboard charts:
Design code left · gold bar · count right
BKB-045: 84 · BKB-031: 62 · BKB-022: 48 · BKB-038: 32 · Others: 22

---

**RETURNS SUMMARY:**

Section title: burgundy bar + "Returns This Month"

3 return rows — compact:
Date · Saree ID · Customer · Reason · Amount
Crimson left border per row

---

## BILL TEMPLATE — PRINTABLE

**Triggered from Page 02 after sale confirmed. Opens as a full screen preview before printing.**

Bill layout — white background · print-optimized:

**Header (burgundy background strip):**
Lotus logo mark · "Beere Kesava & Brothers Silks" Playfair Display 700 18px white centered
"Est. 1999" DM Mono 11px gold centered
"📍 [Shop Address]" DM Sans 12px rgba white 70%

**Bill details:**
Bill No: DM Mono 12px burgundy · Date + Time: DM Mono 11px muted · right aligned

Divider line

**Saree details table:**
Saree ID · Design Code · Description · Amount
DM Mono for codes · DM Sans for descriptions · DM Mono gold for amount

**Customer section:**
"Customer:" DM Sans 500 12px muted · Name DM Sans 600 14px dark
Phone: DM Mono 12px muted

**Total row:**
"Total Amount:" DM Sans 600 14px · "₹8,500" Playfair Display 700 24px gold · right · prominent
"Payment Method: UPI" DM Mono chip

Divider

**Footer:**
"Thank you for shopping with Beere Kesava & Brothers Silks" · Playfair 500 italic 13px burgundy · centered
"Tradition · Trust · Timeless Quality" · DM Mono 9px gold uppercase centered
"Est. 1999" · DM Mono 9px muted centered

**Two print action buttons below preview:**
"🖨 Print Bill" — burgundy filled · full width · 52px
"📲 Send on WhatsApp" — green filled · full width · 52px

---

## IMPORTANT DESIGN NOTES

**1 — New Sale is the primary action:**
The New Sale button and flow must be the fastest and most prominent thing on every screen. Counter staff record multiple sales per day — every unnecessary tap costs time.

**2 — Assign to Finishing appears immediately after sale:**
The "Assign to Finishing Staff" card appears on the sale success screen — right after bill is generated. This is the confirmed flow: sale recorded → bill generated → assign to finishing → saree gets finished before customer takes it.

**3 — External Purchase sarees are clearly tagged everywhere:**
In inventory list · in sale records · in reports · in customer purchase history. Always "📦 External" gold chip. Their IDs follow EXT-[SupplierShortName]-[SEQ] format.

**4 — Low stock alert sends to admin AND superadmin:**
One tap from shop staff sends notification to both. Both receive it in their portals simultaneously.

**5 — Bill is both printed and WhatsApp'd:**
Both options always available after sale. Staff should not be forced to choose one.

**6 — Return only for BKB sarees:**
No return processing for external sarees or sarees not in the system. If barcode not found, manual entry is for BKB sarees only where tag was lost.

**7 — Responsive — not separate designs:**
Same content, same pages, fluid layout. No separate tablet or desktop versions — just responsive grid changes.

**8 — Firm name:** Beere Kesava & Brothers Silks · Est. 1999

**9 — Icons:** Same icon set as all other portals.

**10 — Design style:** Match Admin dashboard exactly — dark headers, gold stats strip highlight, white cards, burgundy + gold + white color system throughout.

---

## DELIVERABLE

6 complete responsive pages:

1. Shop Home — today's overview + quick sale button + recent sales + low stock alert
2. New Retail Sale — 4 step flow + bill generation + assign to finishing
3. Shop Inventory — all sarees with factory/external tags + low stock notice
4. Process Return — scan + reason + confirm flow
5. Customer Profiles — all retail customers + purchase history detail
6. Sales Report — daily + monthly + charts + returns

All pages responsive — works on phone, tablet, desktop with the same design language as the Admin dashboard.