Perfect. All 12 answers are clear. Let me compile everything before writing the prompt.

---

## CONFIRMED ANSWERS — WORKER STAFF PORTAL

**Q1** — 6 pages only: Home · GRN · Design Planning · Issue Material · Receive Sarees · Warp Request Processing

**Q2** — Bottom tab bar navigation — most mobile friendly and easiest to navigate

**Q3** — Worker can choose either unit (Reels or Buns) when entering Jari

**Q4** — Own Factory: select source → enter loom number → enter issued material details. Outsourced: select weaver → enter details. Both flows on same Issue Material page.

**Q5** — Phone camera for scanning — better for usage and development (no extra device needed)

**Q6** — Medium size signature box within the form. Legally better on worker's device. Weaver portal also has same signature flow on weaver's own device.

**Q7** — Both options: Take photo OR choose from gallery

**Q8** — All tag generation and printing available on this portal. Different workers can handle different tasks — one receives saree, another prints tag. Both functions available on the same dashboard.

**Q9** — Warp request approval logged first, then material issue happens separately on Issue Material page (Page 04)

**Q10** — Home shows: Pending raw material receipts · Weavers to issue material · Sarees received awaiting count · Warp requests to process

**Q11** — English only with plain large readable text

**Q12** — Separate section for Own Factory production entries — not mixed with weaver receiving page

---

Now here is the complete Figma Make prompt — written to use minimum credits while being fully comprehensive.

---

## FIGMA MAKE PROMPT
### Worker Staff Portal — All 6 Pages
### Beere Kesava & Brothers Silks ERP · Est. 1999

---

You are designing the complete **Worker Staff Portal** — a mobile-first portal for factory floor workers — for the **Beere Kesava & Brothers Silks ERP (Est. 1999)**. This is a separate portal from the Admin and Superadmin dashboards. Design all 6 pages of this portal in one run. Attach all existing Admin and Superadmin dashboard screenshots as visual reference for brand consistency.

---

## DESIGN SYSTEM — Apply Exactly

**Colors:**
Background: `#FFFFFF` · Primary burgundy: `#6B1A2A` · Dark: `#3D0E1A` · Gold: `#C4923A` · Green: `#1E6640` · Crimson: `#C0392B` · Text: `#1A0A0F` · Muted: `#8B7060` · Card border: `rgba(139,26,46,0.12)` · Cream: `#F0E8D0` · Input background: `#FFF8E7`

**Typography:**
Playfair Display — page titles and large numbers only
DM Sans — all UI text, labels, buttons, descriptions — minimum 14px for readability
DM Mono — all codes, batch IDs, barcodes, quantities

**Mobile canvas:** 390px width · design for phone screen · tall scrollable pages

**Cards:** White · `1px solid rgba(139,26,46,0.12)` border · 14px radius · soft shadow

**Inputs:** Minimum height 52px · `#FFF8E7` warm cream background · 12px radius · 1px border · large clear label above every input · DM Sans 14px minimum inside input

**Buttons:** Minimum height 52px · always icon + text label · never icon alone · 999px radius for primary actions · 12px radius for secondary

**Touch targets:** Every tappable element minimum 44px × 44px

**Plain language:** Full words everywhere · no abbreviations · designed for low digital literacy factory workers

**Icons:** Use same dashboard icon set already established in existing portal pages

---

## NAVIGATION — BOTTOM TAB BAR

Fixed bottom tab bar · height 64px · white background · `1px solid rgba(139,26,46,0.12)` top border · shadow upward

5 tabs — icon above label — each tab 20% width:

Tab 1: 🏠 "Home" — active state: burgundy icon + burgundy underline 2px + burgundy label · inactive: muted gray
Tab 2: 📦 "Receive Stock"
Tab 3: 🪡 "Weavers"
Tab 4: 🔄 "Warp Requests"
Tab 5: 👤 "Profile"

Active tab: burgundy `#6B1A2A` icon and label · 2px burgundy top border on tab
Inactive: `#8B7060` muted gray

The bottom tab bar appears on every page. Content scrolls above it.

---

## GLOBAL HEADER — Every Page

Height: 56px · Background: `#6B1A2A` burgundy · full width

Left: Hamburger menu icon · white · 24px
Center: Page title · Playfair Display 600 18px · white
Right: Notification bell icon · white · unread count red badge if any · 24px

---

## PAGE 01 — HOME / TODAY'S TASKS

Tab active: Home

**Below header — worker identity strip:**
`#3D0E1A` dark background · padding 16px 20px · flex row
Left: Worker avatar circle 44px · burgundy background · white initials · DM Sans 700
Right of avatar: "Good morning," DM Sans 400 13px rgba white 60% · Worker first name: DM Sans 600 18px white below
Far right: Date chip · DM Mono 11px · rgba white 50% · today's date

**Superadmin mode warning strip:** Not applicable for worker. Remove.

---

**PENDING TASKS SECTION:**

Section title: "Today's Tasks" · DM Sans 600 16px `#1A0A0F` · margin 20px 20px 12px

4 task cards stacked vertically · each card:
White background · 14px radius · border · shadow sm · padding 16px · margin 0 20px 12px

Each task card layout:
Left: colored icon circle 40px · icon from dashboard set
Center: Task title DM Sans 600 15px dark · count badge burgundy pill right of title · sub-label DM Sans 13px muted below
Right: "→" arrow icon · muted · tapping navigates to relevant page

**Task 1 — Pending Raw Material Receipts:**
Icon: package icon · gold circle background
Title: "Raw Material to Receive" · Badge: "2 pending" burgundy pill
Sub: "Purchase orders waiting to be received from vendors"
Tap → goes to GRN page

**Task 2 — Weavers to Issue Material:**
Icon: thread/weave icon · green circle background
Title: "Issue Material to Weavers" · Badge: "3 weavers" burgundy pill
Sub: "Weavers are waiting for raw material today"
Tap → goes to Issue Material page

**Task 3 — Sarees Received — Awaiting Count:**
Icon: saree/fabric icon · gold circle background
Title: "Sarees Received — Record Them" · Badge: "8 sarees"
Sub: "Completed sarees submitted by weavers — enter weight and details"
Tap → goes to Receive Sarees page

**Task 4 — Warp Requests to Process:**
Icon: alert icon · crimson circle background
Title: "Warp Requests Pending" · Badge: "3 requests" crimson pill
Sub: "Weavers have asked for more material — needs your action"
Tap → goes to Warp Requests page

---

**QUICK STATS STRIP:**

4 equal tiles in a 2×2 grid · each tile: white card · center aligned · padding 16px · 14px radius · border

Tile 1: "Active Batches" · "24" Playfair Display 700 28px gold · DM Sans 12px muted label below
Tile 2: "Sarees in Factory" · "186" Playfair Display 700 28px dark
Tile 3: "Weavers Working" · "84" Playfair Display 700 28px green
Tile 4: "Low Stock Alerts" · "3" Playfair Display 700 28px crimson

---

**RECENT ACTIVITY:**

Section title: "Recent Activity" · DM Sans 600 16px · right: "View All →" gold link

5 activity rows · each row: white card · padding 14px 16px · border-bottom `rgba(139,26,46,0.08)` · flex row

Each row:
Left: colored dot 8px · green for stock received · crimson for material issued · gold for warp request
Center: DM Sans 13px dark description · DM Mono 10px muted timestamp below
Right: relevant batch/ID in DM Mono 11px burgundy

Sample activities:
● Green · "50 kg Warp received from Sri Venkateswara Textiles" · "Today · 11:42 AM" · SRI-WARP-001
● Crimson · "Material issued to Padma Veni for BATCH-086" · "Today · 10:30 AM" · BATCH-086
● Gold · "Warp request from Ravi Kumar approved" · "Today · 9:45 AM" · BATCH-089
● Green · "6 sarees received from Suresh Murti" · "Yesterday · 4:20 PM" · BATCH-081
● Crimson · "Material issued to Anand K. for BATCH-083" · "Yesterday · 2:10 PM" · BATCH-083

---

## PAGE 02 — RAW MATERIAL RECEIPT (GRN)

Tab active: Receive Stock

**Page intro card:**
White card · margin 16px · padding 16px · border · 14px radius
"Receive raw material from a vendor. Select the purchase order first, then enter the quantities received." · DM Sans 14px muted · line-height 1.6

---

**STEP 1 — SELECT PURCHASE ORDER:**

Section label: "Step 1 — Select Purchase Order" · DM Sans 600 14px burgundy · margin 0 20px 8px

Dropdown input · full width minus 40px margin · 52px height · `#FFF8E7` background · 12px radius · 1px border
Label above: "Which purchase order are you receiving against?" · DM Sans 500 14px dark
Dropdown shows: "PO-2026-022 · Sri Venkateswara Textiles · Warp 50kg" · DM Sans 14px
Chevron down icon right side

After PO selected — auto-fill info card appears below:
`#F0E8D0` cream background · 12px radius · padding 14px 16px
"Vendor: Sri Venkateswara Textiles" · DM Sans 500 13px dark
"Ordered: Warp 50 kg" · DM Sans 13px muted
"PO Date: 01 Jun 2026" · DM Mono 11px muted

---

**STEP 2 — ENTER RECEIVED QUANTITIES:**

Section label: "Step 2 — Enter Received Quantities" · DM Sans 600 14px burgundy

For each material type in the PO — show a quantity input card:

**Warp input card:**
White card · padding 16px · margin 0 20px 12px · border · 14px radius
Top: "🧶 Warp" · DM Sans 600 15px dark · "Ordered: 50 kg" chip · DM Mono 10px gold right
Input: "How much Warp did you actually receive?" · DM Sans 500 14px label above
Number input · 52px height · DM Mono 16px inside · "kg" unit label right inside input · `#FFF8E7` background
Below input: System comparison note — auto-appears after entry:
If match: "✓ Matches purchase order" · DM Sans 12px green
If less: "⚠ Short by X kg — alert will be sent to admin" · DM Sans 12px gold
If more: "⚠ Excess by X kg — alert will be sent to admin" · DM Sans 12px gold

**Resham input card (per color):**
Same structure · "🪡 Resham · Red" · kg input
"Add Another Color" ghost button below — adds new color input row · "+" icon + text

**Jari input card:**
"✨ Jari" · with Type selector (Polyester / Silk Fast) · Grade selector (1G/2G/3G/4G/5G) · Color selector (Gold/Silver/Copper/Pink/Blue/Green)
Unit toggle — two pills side by side: "Reels" (active) · "Buns"
Number input · DM Mono 16px
Auto-conversion shown below input: "= 2 Buns" if reels entered · or "= 8 Reels" if buns entered · DM Mono 12px gold · `rgba(196,146,58,0.10)` background chip
"Add Another Jari Type" ghost button

---

**STEP 3 — ATTACH VENDOR INVOICE:**

Section label: "Step 3 — Attach Vendor Invoice" · DM Sans 600 14px burgundy

Upload area · white card · margin 0 20px · padding 20px · border `1px dashed rgba(139,26,46,0.25)` · 14px radius · center aligned
Camera icon from dashboard set · 32px · muted
"Take a photo of the vendor invoice" · DM Sans 500 14px dark · margin-top 8px
Two buttons below:
"📷 Take Photo" — burgundy filled · 999px radius · 48px height · half width
"🖼 Choose from Gallery" — ghost burgundy · same size · other half

After photo taken: thumbnail preview 80px × 80px · 8px radius · checkmark overlay · "Change Photo" small link below

---

**STEP 4 — CONFIRM AND GENERATE GRN:**

Large confirm button · full width minus 40px · 56px height · `#6B1A2A` burgundy filled · 999px radius · DM Sans 600 16px white
"✓ Confirm Receipt and Generate GRN"

After confirmation:
Success card slides up from bottom · green checkmark 48px · "GRN Created Successfully" Playfair Display 600 20px · GRN number in DM Mono burgundy · "Barcodes are being generated — tap below to print labels" DM Sans 13px muted · "🖨 Print Barcode Labels" burgundy button

---

**BARCODE LABEL PRINT FLOW:**

After GRN confirmed — Print Labels screen:
Shows all batch barcodes generated for this GRN
Each batch: barcode image · batch ID · material type · quantity
"Print All Labels" button — sends to TSC TE244 printer
"Print Individual" option per batch
"Done — Skip Printing" ghost link

---

## PAGE 03 — DESIGN PLANNING UPLOAD

Tab active: Weavers (most related)

**Intro card:** "Upload the color slip for a design. Take a clear photo of the physical color slip paper. This will be linked to the batch and visible to the weaver." · DM Sans 14px muted

---

**STEP 1 — SELECT OR CREATE DESIGN CODE:**

Label: "Design Code" · DM Sans 500 14px dark
Search input · 52px · "Type design code or search..." · DM Sans 14px · `#FFF8E7` background
Below: "Or create a new design code:" · DM Sans 13px muted · "➕ Add New Design Code" gold link

After selecting/creating:
Design info chip: "BKB-045 · Cream Zari Border Saree" · DM Mono 12px burgundy · gold background chip

---

**STEP 2 — TAKE PHOTO OF COLOR SLIP:**

Large camera upload area · white card · 200px height · dashed border · center aligned
Camera icon 48px gold
"Take a clear photo of the color slip paper" · DM Sans 500 15px dark
"The photo must show: border color, body design, pallu details" · DM Sans 12px muted · line-height 1.6

Two buttons:
"📷 Take Photo" burgundy filled · "🖼 Choose from Gallery" ghost

After photo: large preview 100% width · 180px height · object-fit cover · 12px radius
"Retake Photo" small link below · "✓ Photo looks good" green confirmation text

---

**STEP 3 — LINK TO BATCH (OPTIONAL):**

Label: "Link this design to a batch (optional)" · DM Sans 500 14px dark
Dropdown: "Select batch to link..." · shows active batches

---

**SAVE BUTTON:**
"💾 Save Design and Color Slip" · burgundy filled · full width · 56px height

---

## PAGE 04 — ISSUE MATERIAL TO WEAVER

Tab active: Weavers

This is the most critical page. Large inputs, clear steps, no clutter.

---

**STEP 1 — SELECT PRODUCTION SOURCE:**

Section label: "Step 1 — Who is producing the sarees?" · DM Sans 600 14px burgundy

Two large selection cards side by side:

**Card A — Own Factory:**
White card · 50% width · padding 18px · border 2px · 14px radius · center aligned
🏭 factory icon · 32px · muted
"Own Factory" · DM Sans 600 15px dark · margin-top 8px
"Sarees woven in our factory on our looms" · DM Sans 12px muted · line-height 1.5
When selected: burgundy `#6B1A2A` border 2px · gold checkmark top right corner · `rgba(139,26,46,0.04)` background

**Card B — Outsourced Weaver:**
Same structure
🪡 thread icon
"Outsourced Weaver" · DM Sans 600 15px dark
"Sarees woven by an external weaver" · DM Sans 12px muted
When selected: same selected style

---

**IF OWN FACTORY SELECTED — Step 1B:**

Label: "Enter Loom Number" · DM Sans 500 14px dark
Number input · 52px height · `#FFF8E7` background · DM Mono 16px inside
Placeholder: "e.g. 3"
Auto-generates Batch ID: "BKB-L3-001" · shown in DM Mono burgundy chip · `rgba(139,26,46,0.10)` background
Label: "Batch ID (auto-generated)" · DM Sans 12px muted above chip

**IF OUTSOURCED WEAVER SELECTED — Step 1B:**

Label: "Select Weaver" · DM Sans 500 14px dark
Search input with weaver list dropdown · shows weaver photo + name + code + loom count
After selection: weaver info card · photo circle 48px + name DM Sans 600 15px + code DM Mono 10px burgundy + "2 Looms" chip + "Max 2 active batches" note

Batch ID auto-generated: "RAVI-L2-001" · DM Mono burgundy chip

---

**STEP 2 — LINK DESIGN CODE:**

Label: "Which design is this batch for?" · DM Sans 500 14px dark
Search dropdown · design codes with color slip thumbnail preview
After selection: design card · color slip thumbnail 60px × 60px · design code DM Mono burgundy · design name DM Sans 600 14px

---

**STEP 3 — ENTER MATERIALS:**

Section label: "Step 3 — Enter Materials Being Given" · DM Sans 600 14px burgundy

**Warp:**
Label: "Warp" · DM Sans 600 15px dark
"Scan Warp Batch Barcode" button · gold ghost · full width · 48px height · barcode scan icon + text
Opens phone camera for barcode scan · on successful scan: batch info fills automatically
Manual entry option: "Enter Batch ID manually" text link below
After scan/entry: batch info card shows — vendor · quantity · date received

Warp quantity input:
Label: "How much Warp are you giving? (kg)" · DM Sans 500 14px
Number input · 52px · DM Mono 16px · "kg" suffix

**Resham (per color):**
Label: "Resham" · DM Sans 600 15px dark
Color selector row: 6 circular color swatches — Gold · Silver · Copper · Pink · Blue · Green · each 36px diameter · tap to select
After color selected: quantity input appears · "How much [Color] Resham? (kg)" · number input
"Add Another Color" ghost button · "+" icon + text

**Jari:**
Label: "Jari" · DM Sans 600 15px dark
Row 1: Type selector pills — "Polyester" · "Silk Fast" — tap to select · active: burgundy filled · inactive: ghost
Row 2: Grade selector pills — "1G" · "2G" · "3G" · "4G" · "5G"
Row 3: Color selector — same 6 color swatches as Resham
Unit toggle: "Reels" · "Buns" — pills
Quantity input · DM Mono 16px
Auto-conversion: "= 2 Buns" or "= 8 Reels" · DM Mono 12px · gold chip below
"Add Another Jari Type" ghost button

---

**STEP 4 — DIGITAL SIGNATURE:**

Section label: "Step 4 — Collect Weaver Signature" · DM Sans 600 14px burgundy

Info strip: "The weaver must sign below to confirm they received these materials. This creates a legal record." · DM Sans 13px muted · `#F0E8D0` background · 10px radius · padding 10px 14px

**Signature box:**
White background · `1px solid rgba(139,26,46,0.25)` border · 12px radius · 160px height · full width minus 40px
Center placeholder: "Weaver signs here" · DM Sans 14px muted · signature pen icon above
The weaver uses their finger to sign directly on this box
"Clear Signature" small link below right

**Confirm button:**
"✓ Confirm — Open Batch and Notify Weaver" · `#1E6640` green filled · 999px radius · 56px height · full width minus 40px · DM Sans 600 16px white

After confirmation:
Success screen: green checkmark 48px · "Batch Opened" Playfair Display 600 20px · "Weaver has been notified on WhatsApp" DM Sans 13px muted · Batch ID in DM Mono burgundy large · "Back to Home" ghost button

---

## PAGE 05 — RECEIVE SAREES FROM WEAVER

Tab active: Weavers

Two sub-sections on this page: A) Receive from Outsourced Weaver · B) Own Factory Production Entry

---

**SUB-SECTION A — RECEIVE FROM OUTSOURCED WEAVER:**

Section header: "Sarees from Outsourced Weavers" · DM Sans 600 16px dark

**Select weaver and batch:**
Label: "Select Weaver" · dropdown with search · weaver photo + name + code
After selection: active batch shown automatically
Batch card: BATCH-086 · PADMA-L1 · "3 of 5 sarees done so far" · progress bar gold fill

---

**FOR EACH SAREE — Entry card:**

"Adding Saree [Number] to BATCH-086" · DM Sans 600 14px dark

**Weight entry:**
Label: "Weigh this saree and enter the weight" · DM Sans 500 14px dark
Number input · large · 60px height · DM Mono 20px inside · "grams" suffix
Auto-check after entry:
If within 600g of standard: "✓ Weight is acceptable" green strip
If over 600g below: "⚠ Weight is too low — deduction will apply" crimson strip · shows deduction amount

**Photo upload:**
Label: "Take a photo of this saree" · DM Sans 500 14px dark
"📷 Take Photo" burgundy filled · "🖼 Choose from Gallery" ghost · side by side
Photo preview after capture

**Saree ID generated:**
After weight and photo: auto-generated ID chip
"PADMA-L1-004" · DM Mono 600 18px burgundy · large visible
Label: "Saree ID (auto-generated)" · DM Sans 12px muted

**Print Tag button:**
"🖨 Print Saree Tag" · gold ghost button · full width · 48px height
Opens tag preview: barcode + date of dispatch + weaver name + saree ID · label sized 100mm × 50mm
"Print Now" burgundy filled · "Skip for now" ghost

**Add next saree button:**
"➕ Add Next Saree" · burgundy ghost · full width · 48px height

---

**BATCH COMPLETE CONFIRMATION:**

When all sarees entered:
"✓ Mark Batch as Complete — Weaver Confirms Submission" · green filled · full width · 56px height
After tap: success screen showing batch summary

---

**SUB-SECTION B — OWN FACTORY PRODUCTION:**

Clearly separated section below · divider with label: "Own Factory Production" · DM Sans 600 16px dark · burgundy left bar decoration

**Loom number input:**
Label: "Which loom produced these sarees?" · DM Sans 500 14px
Number input · DM Mono 16px · "Loom Number" placeholder

**Same entry flow as Sub-section A:**
Weight entry per saree
Photo upload per saree
Auto-generated ID: "BKB-L3-004" format instead of weaver name format
Print tag — same flow
No digital signature needed (own factory — no external weaver)
"Loom [Number]" shown instead of weaver name on the tag

---

## PAGE 06 — WARP REQUEST PROCESSING

Tab active: Warp Requests

**Intro:** "These are requests from weavers asking for more raw material. Check their batch progress before approving." · DM Sans 14px muted · margin 16px 20px

---

**PENDING REQUESTS LIST:**

For each pending request — request card:
White card · margin 0 20px 14px · 14px radius · border · shadow sm
Left border 4px — crimson if urgent · gold if normal

**Card content:**

Top row: Weaver photo circle 44px + "Ravi Kumar" DM Sans 600 15px dark + "WV-001" DM Mono 10px burgundy + "BATCH-089" chip right

Request details:
"📦 Requesting: 3 kg Warp" · DM Sans 500 14px dark
"Reason: Extra sarees for Lakshmi Silks order" · DM Sans 13px muted italic
"Raised: 2 days ago" · DM Mono 10px muted

Batch progress — clear and large:
"Batch Progress: 4 of 8 sarees done" · DM Sans 500 13px muted
Progress bar · 6px height · 50% gold fill
"50% complete — qualifies for warp request ✓" · DM Sans 12px green

Current stock note:
`#F0E8D0` cream background · 10px radius · padding 8px 12px
"Warp available in factory: 142 kg — enough for this request" · DM Sans 12px muted

Two action buttons · full width · side by side:
"✓ Approve" · `#1E6640` green filled · 999px radius · 48px height · DM Sans 600 14px · icon + text
"✗ Reject" · `1px solid #C0392B` crimson ghost · same size

After approve: success toast · "Request approved — Ravi Kumar notified on WhatsApp" · green · slides from top
Worker then goes to Issue Material page (Page 04) to actually issue the additional material.

---

**3 sample pending request cards:**

Card 1: Ravi Kumar · WV-001 · BATCH-089 · 3 kg Warp · 4/8 done (50%) · Raised 2 days ago
Card 2: Padma Veni · WV-002 · BATCH-086 · 2 kg Warp + Resham Red 500g · 3/5 done (60%) · Raised 1 day ago
Card 3: Suresh Murti · WV-007 · BATCH-081 · 4 kg Warp · 2/4 done (50%) · Raised today

---

**EMPTY STATE (when no pending requests):**

Center of page: ✓ checkmark icon 48px green · "No Pending Requests" DM Sans 600 18px dark · "All warp requests have been processed" DM Sans 14px muted

---

## BARCODE AND TAG PRINT — GLOBAL COMPONENT

Available on Page 02 (raw material labels) and Page 05 (saree tags):

**Tag Preview Screen (full screen overlay):**

Header: "Tag Preview" · DM Sans 600 18px white · burgundy background header 56px · close × button right

**Label preview box:**
White background · `1px solid rgba(139,26,46,0.20)` border · 14px radius · padding 20px · margin 20px · aspect ratio matches 100mm × 50mm

Label contents (inside preview box):
Top: "Beere Kesava & Brothers Silks · Est. 1999" · DM Sans 400 9px muted · centered
Barcode: Code 128 · black bars · full width of label · 40px height
Below barcode: Saree ID "PADMA-L1-004" · DM Mono 700 14px · centered
Below ID: Two columns
Left: "Weaver:" gold label · "Padma Veni" dark value · DM Sans 12px
Right: "Date:" gold label · "13 Jun 2026" dark value
Bottom right: QR code · 32px × 32px · encodes public URL
Bottom center: "Beere Kesava & Brothers Silks" · DM Sans 8px muted

**Print settings (below preview):**
"Printer: TSC TE244" · DM Mono 12px muted · lock icon (cannot change on this screen)
"Copies:" number input · small · default 1

**Two buttons:**
"🖨 Print Now" · burgundy filled · full width · 56px height
"Skip Printing" · ghost · center · DM Sans 14px muted

---

## IMPORTANT DESIGN NOTES

**1 — Every input minimum 52px height.** Factory workers use fingers. Small inputs cause errors.

**2 — Every label above its input.** Never placeholder-only. Labels must always be visible.

**3 — Show system feedback immediately.** After every entry — weight check, barcode scan, quantity comparison — show result instantly below the input. Green for good. Gold for warning. Crimson for error.

**4 — Jari always shows both units.** When worker enters Reels — show Bun equivalent. When enters Buns — show Reel equivalent. Always both. This prevents confusion.

**5 — Signature box is medium size.** 160px height · full width. Large enough to sign clearly. Not full screen.

**6 — Print tag available on every saree record.** Worker who receives saree and worker who prints tag may be different people. Both functions on same page, both accessible.

**7 — No login on this portal.** OTP only. After login the portal remembers the worker session.

**8 — Bottom tab bar always visible.** Content scrolls above it. Never hidden by keyboard — use appropriate scroll handling.

**9 — Own Factory and Outsourced clearly separated.** Different badge colors. Different ID formats. Never mixed in the same list.

**10 — Firm name:** Beere Kesava & Brothers Silks · Est. 1999 — in footer and tag labels.

---

## DELIVERABLE

6 complete mobile screens (390px wide):
1. Home / Today's Tasks
2. Raw Material Receipt (GRN) — 4 step flow
3. Design Planning Upload — 3 step flow
4. Issue Material to Weaver — 4 step flow with Own Factory + Outsourced selection
5. Receive Sarees from Weaver — with Own Factory sub-section + tag print flow
6. Warp Request Processing — with approve/reject cards

All screens use bottom tab navigation. All screens have the global header. All screens follow the BKB Silks design system exactly as established in the Admin and Superadmin portal screenshots attached.

---

Paste this single prompt into Figma Make and attach all existing Admin and Superadmin page screenshots as reference. This covers the complete Worker Staff portal in one run.