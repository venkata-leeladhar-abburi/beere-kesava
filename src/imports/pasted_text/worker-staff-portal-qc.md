FIX PROMPT 1
Worker Staff Portal — Add Page 06: Quality Check
Beere Kesava & Brothers Silks ERP · Est. 1999

You are adding a new page to the existing Worker Staff Portal — Page 06: Quality Check. This page is inserted between Page 05 (Receive Sarees) and Page 07 (Warp Request Processing). Attach all existing Worker Staff portal screenshots as reference. Match the exact mobile design language — same bottom tab bar, same global header, same card styles, same input styles.

DESIGN SYSTEM — Same as Worker Staff Portal
Background: #FFFFFF · Burgundy: #6B1A2A · Dark: #3D0E1A · Gold: #C4923A · Green: #1E6640 · Crimson: #C0392B · Muted: #8B7060 · Cream: #F0E8D0 · Input: #FFF8E7
Fonts: Playfair Display · DM Sans minimum 14px · DM Mono for codes
Mobile: 390px · all inputs 52px minimum height · all buttons 52px minimum · icon + text always
Icons: same dashboard icon set used across all existing portals

NAVIGATION UPDATE
Update bottom tab bar — add QC tab:
Old tabs: Home · Receive Stock · Weavers · Warp Requests · Profile
New tabs: Home · Receive Stock · QC · Weavers · Warp Requests
Remove Profile tab from bottom bar — move to hamburger menu inside header.
QC tab: magnifying glass icon + "QC" label · crimson badge showing pending count
Update Home page task cards:
Add new task card to Page 01 Home:
"Sarees Awaiting Quality Check" · count badge crimson · "Inspect sarees submitted by weavers" sub-label · tap → goes to QC page

PAGE 06 — QUALITY CHECK
Global header: "Quality Check" · burgundy background 56px · bell icon right

QC QUEUE — ALL SAREES AWAITING CHECK
Intro card:
White card · margin 16px · padding 16px · border · 14px radius
"Inspect every saree submitted by weavers. Mark each one as Passed or Defective. Defective sarees will be stored separately and the weaver will be notified automatically." · DM Sans 14px muted · line-height 1.6
Stats row — 3 chips in a row:
"32 Awaiting QC" — crimson chip
"238 Passed This Month" — green chip
"10 Rejected This Month" — gold chip

QC QUEUE LIST:
Section title: "Sarees Waiting for Inspection" · DM Sans 600 16px dark · margin 20px 20px 12px
Each saree in queue — queue card:
White card · margin 0 20px 12px · 14px radius · border · shadow sm
Left border 4px gold — awaiting QC
Card content:
Top row: Saree ID chip DM Mono 13px burgundy + Batch chip DM Mono 10px gold right
Source badge: "🪡 Outsourced · Padma Veni" green pill OR "🏭 Own Factory · Loom 3" dark pill
Design: "BKB-045 · Self Brocade · SB-001" — DM Sans 13px muted
Weight: "842 grams" — DM Mono 12px dark · "Standard: 850g · Variance: -8g ✓" — DM Sans 11px green below
Submitted: "Submitted today · 2 hours ago" — DM Mono 10px muted
"🔍 Start QC Inspection" button — burgundy filled · full width · 48px height · icon + text

6 sample queue cards:
Card 1: PADMA-L1-004 · BATCH-086 · Outsourced · Padma Veni · BKB-045 · 842g · Today
Card 2: RAVI-L2-008 · BATCH-089 · Outsourced · Ravi Kumar · BKB-031 · 918g · Today
Card 3: BKB-L3-002 · BATCH-OWN · Own Factory · Loom 3 · BKB-022 · 774g · Yesterday
Card 4: SURESH-L2-003 · BATCH-081 · Outsourced · Suresh Murti · BKB-038 · 856g · Yesterday
Card 5: PADMA-L1-005 · BATCH-086 · Outsourced · Padma Veni · BKB-045 · 848g · Yesterday
Card 6: BKB-L1-004 · BATCH-OWN · Own Factory · Loom 1 · BKB-019 · 1048g · 2 days ago

QC INSPECTION SCREEN
Triggered when: Worker taps "Start QC Inspection" on any queue card
Full screen view — replaces queue list

Top bar:
Back arrow left · "Inspecting: PADMA-L1-004" · DM Sans 600 16px white · burgundy header
Saree detail card:
White card · margin 16px · padding 16px · border · 14px radius
Saree ID: DM Mono 700 20px burgundy · large and prominent
Weaver: "Padma Veni · WV-002" · DM Sans 600 14px dark
Batch: "BATCH-086" · DM Mono 11px gold chip
Design: "BKB-045 · Self Brocade · SB-001" · DM Sans 13px muted
Weight recorded: "842 grams" · DM Mono 600 16px dark
Standard weight: "Standard: 850g" · DM Sans 12px muted
Variance: "−8 grams · Within acceptable range ✓" · DM Sans 12px green

INSPECTION CHECKLIST:
Section: "Physical Inspection" · DM Sans 600 15px dark · margin 20px 20px 8px
Sub: "Physically inspect this saree now. Check each item below:" · DM Sans 13px muted
4 inspection items — each as a large tappable row:
White card · padding 14px 16px · border · margin 0 20px 8px · 12px radius
Left: checkbox circle 24px · unchecked: rgba(139,26,46,0.15) border · checked: burgundy filled white checkmark
Right of checkbox: inspection item label DM Sans 500 14px dark
Item 1: "Threads — No loose or broken threads"
Item 2: "Design — Pattern is correct and complete"
Item 3: "Jari — Metallic thread is intact and properly woven"
Item 4: "Measurements — Size and weight within standard range"
All 4 must be checked before Pass/Fail buttons activate.

RESULT BUTTONS:
After all 4 checked — two large buttons appear:
"✓ PASSED — Move to Stock" · #1E6640 green filled · full width minus 40px · 56px height · DM Sans 700 16px white · icon + text
"✗ DEFECTIVE — Mark as Rejected" · 1px solid #C0392B crimson ghost · full width minus 40px · 56px height · DM Sans 700 16px crimson · icon + text

IF PASSED — Success Flow
Green success card slides up:
Large green checkmark circle 56px
"PADMA-L1-004 — Quality Check PASSED" · Playfair Display 600 20px dark
"This saree has been moved to stock and is ready for sale." · DM Sans 13px muted
Saree ID in DM Mono burgundy large
Two buttons:
"✓ Inspect Next Saree" · burgundy filled · full width · 48px
"← Back to QC Queue" · ghost · full width · 48px

IF DEFECTIVE — Defect Entry Flow
Step 1 — Select Defect Type:
Section: "What is wrong with this saree?" · DM Sans 600 15px dark
6 defect type cards — 2 column grid:
Each card: white · 12px radius · border · padding 12px · center aligned · 80px height
Icon 24px + label DM Sans 500 13px dark below
Defect types:
"Thread Break" · "Design Error" · "Jari Issue" · "Weight Problem" · "Measurement Error" · "Other"
When selected: burgundy border 2px · rgba(139,26,42,0.06) background · gold checkmark top right
Multiple selection allowed.

Step 2 — Take Defect Photo:
Section: "Take a photo of the defect" · DM Sans 600 15px dark
Sub: "Photograph the specific area that has the defect clearly." · DM Sans 13px muted
Upload area · dashed border · 120px height · center
Camera icon 36px gold
"📷 Take Defect Photo" · burgundy filled · full width · 52px height
"🖼 Choose from Gallery" · ghost · full width · 48px height
After photo: thumbnail 80px × 80px · checkmark overlay · "Retake" link

Step 3 — Notes (Optional):
Label: "Additional Notes (Optional)" · DM Sans 500 14px
Textarea · 80px height · #FFF8E7 background · 12px radius
Placeholder: "Describe the defect in detail if needed..."

Step 4 — Confirm Defective:
Auto-calculated deduction info strip:
rgba(192,57,43,0.08) crimson background · crimson border · 10px radius · padding 12px 16px
"⚠ Deduction Applied Automatically:"
"Making charge for this saree (₹450) will be deducted from Padma Veni's payment."
"Weaver will be notified with the defect photo via WhatsApp." · DM Sans 12px crimson
"✗ Confirm — Mark as Defective" · crimson filled #C0392B · full width minus 40px · 56px height · DM Sans 600 15px white · icon + text

DEFECTIVE CONFIRMED — Success Flow
Crimson confirmation card:
"PADMA-L1-004 — Marked as DEFECTIVE" · Playfair Display 600 18px dark
"Stored in defective inventory. Deduction applied to Padma Veni. WhatsApp notification sent with defect photo." · DM Sans 13px muted
Defect type chips shown: "Thread Break" "Design Error"
Deduction amount: "₹450 deducted" · DM Mono 14px crimson
"✓ Inspect Next Saree" · burgundy filled · full width · 48px
"← Back to QC Queue" · ghost · full width · 48px

DEFECTIVE SAREES SECTION
Section below QC queue — always visible:
Section title: "Defective Sarees — Stored Separately" · DM Sans 600 16px dark · crimson left border
Sub: "These sarees failed quality check. They are stored separately in defective inventory. Admin can view these but cannot take action here." · DM Sans 13px muted
Filter: "Today" · "This Week" · "This Month" · "All Time"
Each defective saree — compact card:
Saree ID DM Mono burgundy · Defect types as crimson chips · Weaver name · Date rejected · Deduction amount DM Mono crimson
"👁 View Details" ghost button

WHAT NOT TO CHANGE
Navigation tabs update only as specified · all other pages unchanged · all existing design patterns preserved