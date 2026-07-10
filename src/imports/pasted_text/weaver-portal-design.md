Perfect. All answers are clear. Let me also note the design style instruction from the screenshot shared.

---

## CONFIRMED ANSWERS — WEAVER PORTAL

**Q1 — Design Style:** Simpler version — same brand colors and typography as Admin dashboard but cleaner and less dense. Large text, large buttons, minimal clutter. Match the font style visible in the Superadmin screenshot shared.

**Q2 — Login:** OTP login — same as all other portals

**Q3 — Device:** Each weaver has their own phone with their own login

**Q4 — Signature:** Both options available:
- Worker hands their phone to weaver who signs on worker's device
- OR worker sends notification to weaver — weaver signs on their own device
Both methods must work

**Q5 — Batch Limit:** Maximum 2 active batches — system rule, not display limit

**Q6 — Design Library:** Integrated — accessible from My Batches and View Color Slip pages. Not a separate page.

**Q7 — Language:** Simple English only — very plain large words

**Q8 — Warp Request Gate:** Both — locked state with explanation + progress bar showing how close they are

**Q9 — Payment Ledger:** Full transparency — exact Saree ID + defect type for each deduction

**Q10 — Notifications:** Grouped by type + chronological list within each group

---

## ⚠ CROSS-PORTAL IMPACT

**Signature flow update affects Worker Staff portal:**
The material confirmation signature on the Worker Staff Issue Material page (Page 04) needs to show both options:
1. "Weaver signs here on this phone" — for when weaver is physically present
2. "Send signature request to weaver's phone" — for when weaver signs remotely on their own device

This is a fix needed for Worker Staff portal Page 04. I will note this and write a fix prompt when you ask.

---

Now here is the complete Weaver portal prompt.

---

## FIGMA MAKE PROMPT
### Weaver Portal — All 6 Pages
### Beere Kesava & Brothers Silks ERP · Est. 1999

---

You are designing the complete **Weaver Portal** — a mobile-only portal for weavers — for the **Beere Kesava & Brothers Silks ERP (Est. 1999)**. This is the simplest portal in the system because weavers have the lowest digital literacy of all users. Design all 6 pages on a 390px mobile canvas.

**CRITICAL STYLE INSTRUCTION:**
This portal must match the Admin and Superadmin dashboard design style exactly — same burgundy `#6B1A2A` primary color, same gold `#C4923A` accent, same Playfair Display + DM Sans + DM Mono typography, same dark compact headers, same dark stats strips, same white card patterns with subtle borders. Study the Superadmin dashboard screenshot carefully — match that exact font weight, color usage, and visual hierarchy. Do NOT create a custom light or minimal style. The brand identity must be consistent across all portals. The only simplification is: larger text, larger buttons, fewer elements per screen, more white space. The premium silk brand identity must be felt even on this simple mobile portal.

Attach all existing Admin, Superadmin, Worker Staff, and Finishing Staff portal screenshots as visual reference.

---

## DESIGN SYSTEM — Apply Exactly

**Colors:**
Background: `#FFFFFF` · Primary burgundy: `#6B1A2A` · Dark: `#3D0E1A` · Gold: `#C4923A` · Green: `#1E6640` · Crimson: `#C0392B` · Text: `#1A0A0F` · Muted: `#8B7060` · Card border: `rgba(139,26,46,0.12)` · Cream: `#F0E8D0` · Input: `#FFF8E7`

**Typography — Match Superadmin dashboard font style exactly:**
Playfair Display 700 — page headings and large numbers · same weight and style as seen in Admin dashboard
Playfair Display 500 italic — sub-headings in gold
DM Sans 400/500/600 — all UI text, labels, descriptions · minimum 15px for weaver portal (larger than other portals)
DM Mono 500 — all codes, batch IDs, quantities, amounts

**Mobile canvas:** 390px width · tall scrollable pages

**Cards:** White · `1px solid rgba(139,26,46,0.12)` border · 16px radius · `box-shadow 0 2px 16px rgba(44,24,16,0.08)` · padding 20px

**Inputs:** Minimum 56px height · `#FFF8E7` warm cream background · 14px radius · 1px border burgundy 15% · label always above in DM Sans 500 15px

**Buttons:** Minimum 56px height · always icon + text · 999px radius for primary · DM Sans 600 15px · generous padding

**Touch targets:** Every tappable element minimum 48px × 48px

**Section title pattern:** Same as Admin — 4px burgundy vertical bar left + DM Sans 600 16px title + gold right link

**Icons:** Same dashboard icon set used across all existing portals — match exactly

---

## GLOBAL HEADER — Every Page

Height: 60px · Background: `#6B1A2A` burgundy · full width

Left: Lotus icon/logo mark — white · 24px — same logo mark as Admin portal
Center: Page title · Playfair Display 600 18px · white
Right: Bell icon · white · red dot badge if unread notifications · 24px

---

## BOTTOM TAB BAR — Every Page

Fixed bottom · height 68px · white background · `1px solid rgba(139,26,46,0.12)` top border · upward shadow

5 tabs — icon above label — each 20% width:
Tab 1: 📋 "My Batches" — active: burgundy icon + burgundy label + 2px burgundy top line
Tab 2: ✓ "Confirm" — material receipt confirmation
Tab 3: 🎨 "Color Slip" — view design
Tab 4: 🪡 "Warp" — raise warp request
Tab 5: 💰 "Payments" — payment ledger

Active tab: `#6B1A2A` icon and label · 2px top border burgundy
Inactive: `#8B7060` muted gray

Notification red dot badge on Tab 2 if material receipt pending confirmation.

---

## PAGE 01 — MY BATCHES

Tab active: My Batches

---

**HERO HEADER — Dark:**
Background: `#3D0E1A` dark burgundy · padding 24px 20px
Eyebrow: "SINCE 1999 · MY WORK" — DM Mono 9px uppercase letter-spacing 3px rgba white 45%
Heading: "My Batches" — Playfair Display 700 32px white
Sub: "Active and completed work" — Playfair Display 500 italic 18px gold `#C4923A`

**Weaver identity row below heading:**
Weaver photo circle 48px · if uploaded: photo · if not: initials burgundy bg
Name: DM Sans 600 16px white · Weaver code: DM Mono 10px rgba white 55% below
"2 Active Batches" chip: gold border · gold text · DM Mono 10px · 999px radius

---

**STATS STRIP — Dark burgundy:**
Same pattern as Admin dashboard stats strip · 3 columns · dividers between

Column 1:
Label: "SAREES PRODUCED THIS MONTH" — DM Mono 9px uppercase rgba white 55%
Number: "18" — Playfair Display 700 28px white
Below: "↑ 3 more than last month" — DM Sans 12px rgba white 50%

Column 2 — GOLD HIGHLIGHT:
Label: "QC PASS RATE" — DM Mono 9px gold uppercase
Number: "97%" — Playfair Display 700 28px `#1A0A0F` dark
Below: "2 rejected this month" — DM Sans 12px muted

Column 3:
Label: "TOTAL EARNED THIS MONTH" — DM Mono 9px uppercase rgba white 55%
Number: "₹8,100" — Playfair Display 700 24px white
Below: "After deductions" — DM Sans 12px rgba white 50%

---

**ACTIVE BATCHES SECTION:**

Section title: burgundy vertical bar + "Active Batches" + "View History →" gold right link · margin 20px 20px 12px

Sub-label: "You can have a maximum of 2 active batches at a time. This is a system rule." — DM Sans 13px muted · margin 0 20px 12px

---

**ACTIVE BATCH CARD 1:**

White card · margin 0 20px 14px · 16px radius · border · shadow
Top: 4px burgundy left border — active batch

**Batch header row:**
Batch ID: "BATCH-086" — DM Mono 600 16px `#6B1A2A` burgundy · large
Status badge right: "🟢 Open — Weaving in Progress" — green pill · DM Sans 500 12px

**Design row:**
🎨 icon · "Design: BKB-045 · Cream Zari Border Saree" — DM Sans 500 14px dark

**Progress section — large and clear:**
"Your progress:" — DM Sans 500 14px muted · margin-bottom 8px
Large number: "3 of 5 sarees done" — Playfair Display 700 24px dark · centered in progress area
Progress bar: 10px height · 60% gold `#C4923A` fill · `rgba(139,26,46,0.10)` track · 999px radius · full width inside card
"60% complete" — DM Mono 12px muted · right aligned below bar

**Materials given row:**
📦 icon · "Materials:" — DM Sans 500 13px muted
"Warp: 4.5 kg · Resham Red: 800g · Jari: PLY-2G-Gold 8 Reels" — DM Sans 13px dark · line-height 1.5

**Date row:**
📅 "Started: 01 Jun 2026" — DM Sans 13px muted · "Expected: 15 Jun 2026" — DM Sans 13px muted

**Color slip thumbnail:**
If color slip uploaded — small thumbnail 60px × 60px · 8px radius · border · right side of card
"Tap to view →" — DM Sans 11px gold link below thumbnail

**Two action buttons full width:**
"🎨 View Color Slip" — gold ghost button · 48px height · full width · icon + text · margin-bottom 8px
"🪡 Raise Warp Request" — burgundy ghost · 48px height · full width · icon + text

---

**ACTIVE BATCH CARD 2:**
Same structure — different batch:
BATCH-089 · "🟡 50% Submitted — Warp Request Unlocked" · gold status badge
Design: BKB-031 · 4 of 8 sarees done · 50%
"✓ Warp request is now available for this batch" — DM Sans 12px green · inside card

---

**SECOND BATCH LIMIT NOTE (when 2 active):**
Full width cream strip · `#F0E8D0` background · 12px radius · padding 12px 16px · margin 0 20px
"⚠ You have 2 active batches — the maximum allowed. Complete one batch before a new one can be assigned." — DM Sans 13px muted

---

**COMPLETED BATCH HISTORY:**

Section title: burgundy bar + "Completed Batches" + "See All →" gold right link · margin 20px 20px 12px

3 compact history rows · white card per row · padding 14px 16px · border · 12px radius · margin 0 20px 8px

Each row:
Left: batch ID DM Mono 12px burgundy · design code DM Mono 10px muted below
Center: "6 sarees · All passed ✓" OR "5 sarees · 1 rejected" — DM Sans 13px
Right: "Apr 2026" DM Mono 10px muted · "₹2,700" DM Sans 600 13px gold

Row 1: BATCH-072 · BKB-038 · 6 sarees · All passed ✓ · Apr 2026 · ₹2,700
Row 2: BATCH-061 · BKB-022 · 5 sarees · 1 rejected · Apr 2026 · ₹1,960
Row 3: BATCH-054 · BKB-045 · 7 sarees · All passed ✓ · Mar 2026 · ₹3,150

**DESIGN LIBRARY ACCESS — at bottom of My Batches page:**

Section title: burgundy bar + "Design Library" + "View All →" gold right link

Sub: "View all design color slips and design graphs. Available for reference during your weaving work." — DM Sans 13px muted

3 design cards in horizontal scroll row:
Each card: white · 12px radius · border · 100px width · 80px color slip photo · design code DM Mono 10px burgundy · design name DM Sans 12px dark

After the 3 visible: "View All Designs →" gold link

---

## PAGE 02 — CONFIRM MATERIAL RECEIPT

Tab active: Confirm
Red notification badge on tab if new confirmation pending

---

**HERO HEADER — Dark:**
Eyebrow: "SINCE 1999 · MATERIAL RECEIPT"
Heading: "Confirm Materials" — Playfair Display 700 32px white
Sub: "Sign to confirm receipt" — Playfair Display 500 italic 18px gold

---

**WHEN CONFIRMATION PENDING:**

**Alert card — top priority:**
`rgba(196,146,58,0.15)` gold background · `2px solid #C4923A` gold border · 16px radius · padding 18px 20px · margin 16px 20px
Bell icon 24px gold · "New Batch Assigned — Materials Ready" — DM Sans 600 16px dark
"Your materials have been issued. Please review the list below and sign to confirm receipt and open your batch officially." — DM Sans 14px muted · line-height 1.6

**Batch info row:**
Batch ID: DM Mono 14px burgundy · "BATCH-086" — large
Design: "BKB-045 · Cream Zari Border Saree" — DM Sans 500 13px muted

---

**MATERIALS LIST:**

Section title: burgundy bar + "Materials You Are Receiving"

Each material — clear readable card:
White card · padding 16px 18px · border · 12px radius · margin 0 20px 10px

**Warp card:**
Top row: 🧶 icon + "Warp" DM Sans 600 16px dark
Amount: "4.5 kg" — Playfair Display 700 24px gold · centered · large and prominent
Sub: "Cotton/Silk thread for the loom" — DM Sans 13px muted

**Resham card:**
🪡 "Resham" DM Sans 600 16px dark
"Red: 800g · Gold: 400g" — Playfair Display 600 20px dark
Sub: "Silk thread for design work" — DM Sans 13px muted

**Jari card:**
✨ "Jari" DM Sans 600 16px dark
"Polyester 2G Gold: 8 Reels (2 Buns)" — Playfair Display 600 18px dark
"Silk Fast 1G Silver: 4 Reels (1 Bun)" — Playfair Display 600 18px dark · margin-top 4px
Sub: "Metallic thread · 1 Bun = 4 Reels" — DM Sans 13px muted

---

**COLOR SLIP REVIEW:**

Section title: burgundy bar + "Check Your Color Slip"

Sub: "This is the design you are weaving. Review it carefully before signing." — DM Sans 13px muted

Color slip image — full width · 200px height · 12px radius · object-fit cover
Below image: "Design: BKB-045 · Cream Zari Border Saree" — DM Mono 12px burgundy centered
"Tap to see the full image" — DM Sans 12px gold link centered

---

**SIGNATURE SECTION:**

Section title: burgundy bar + "Your Signature"

Sub: "Sign below to confirm you have received all materials listed above. This creates a permanent record." — DM Sans 13px muted

**Signature method selector — two options:**

**Option A — Sign on this phone:**
White card · border · 12px radius · padding 16px
📱 icon + "Sign here on this phone" — DM Sans 600 14px dark
Sub: "If the worker is with you, sign directly below" — DM Sans 12px muted
When selected: signature box appears below (see below)

**Option B — Sign on your own phone:**
White card · border · 12px radius · padding 16px · margin-top 10px
📲 icon + "Sign on your own phone" — DM Sans 600 14px dark
Sub: "Worker will send you a notification to sign on your own device" — DM Sans 12px muted
"Send Signature Request" button — gold ghost · 48px · full width

**Signature box (Option A):**
White background · `1px solid rgba(139,26,42,0.25)` border · 14px radius · 160px height · full width minus 40px margin
"Sign here with your finger" — DM Sans 14px muted centered · signature pen icon 28px above text
"Clear" small link bottom right · DM Sans 12px gold

---

**CONFIRM BUTTON:**

Info strip above button:
`#F0E8D0` cream · 10px radius · padding 10px 14px
"By signing and confirming, you agree that you have received all the materials listed above. This record is permanent." — DM Sans 12px muted

"✓ Confirm — Open My Batch" — `#1E6640` green filled · full width minus 40px · 56px height · 999px radius · DM Sans 600 16px white · icon + text

---

**SUCCESS STATE:**

Green checkmark circle 60px · centered
"Batch Officially Opened!" — Playfair Display 600 22px dark · centered
"BATCH-086 is now open. You can start weaving. Good luck!" — DM Sans 14px muted · centered
Batch ID DM Mono 14px burgundy chip · centered
"← Go to My Batches" — burgundy filled button · full width minus 40px · 52px height

---

**WHEN NO CONFIRMATION PENDING:**

Empty state card · white · 16px radius · border · padding 32px · margin 20px · centered content
Checkmark icon 48px green
"All Caught Up!" — Playfair Display 600 20px dark
"No materials waiting for confirmation right now. When a new batch is assigned, it will appear here." — DM Sans 14px muted · line-height 1.6

---

## PAGE 03 — VIEW COLOR SLIP

Tab active: Color Slip

---

**HERO HEADER — Dark:**
Eyebrow: "SINCE 1999 · DESIGN REFERENCE"
Heading: "Color Slip" — Playfair Display 700 32px white
Sub: "Your design instructions" — Playfair Display 500 italic 18px gold

---

**BATCH SELECTOR:**

If weaver has 2 active batches — show selector at top:
Label: "Which batch?" — DM Sans 500 14px dark
Two pill buttons side by side:
"BATCH-086" · "BATCH-089" — DM Mono 12px · tap to switch
Active: burgundy filled white text · Inactive: ghost

---

**COLOR SLIP DISPLAY:**

Design code chip: "BKB-045" — DM Mono 700 16px burgundy · `rgba(139,26,46,0.10)` background · 999px radius · padding 6px 16px · centered

Design name: "Cream Zari Border Saree" — Playfair Display 600 20px dark · centered

**Color slip image — large:**
Full width · 280px height · 14px radius · object-fit cover
Tap to zoom: full screen image viewer with pinch-to-zoom
"Tap image to zoom in" — DM Sans 12px muted · centered below

**Design details — large readable cards:**

4 detail cards stacked:

**Card 1 — Border:**
Left: colored square swatch 20px × 20px matching border color
"Border Color" — DM Sans 500 13px muted · label
"Cream with Gold Zari" — DM Sans 600 16px dark · value

**Card 2 — Body:**
"Body Design" label
"Self brocade — small gold checks throughout" — DM Sans 600 16px dark

**Card 3 — Pallu:**
"Pallu Design" label
"Heavy gold zari border, lotus motif, 6 inch width" — DM Sans 600 16px dark

**Card 4 — Jacquard/Motif:**
"Motif Details" label
"Lotus flower repeat · 4 inch spacing" — DM Sans 600 16px dark

Each card: white · 12px radius · border · padding 14px 16px · margin 0 20px 10px

---

**DESIGN LIBRARY ACCESS FROM COLOR SLIP PAGE:**

Section title: burgundy bar + "Other Designs in Library"

3 design cards horizontal scroll — same as My Batches page

"View Full Design Library →" gold link at end

---

**NOTE:**

Full width cream strip · bottom of page:
"This color slip was uploaded by Worker Staff. If you have any questions about the design, contact your supervisor." — DM Sans 13px muted

---

## PAGE 04 — RAISE WARP REQUEST

Tab active: Warp

---

**HERO HEADER — Dark:**
Eyebrow: "SINCE 1999 · WARP REQUEST"
Heading: "Raise Warp Request" — Playfair Display 700 32px white
Sub: "Request additional material" — Playfair Display 500 italic 18px gold

---

**BATCH SELECTOR (if 2 active batches):**
Same pill selector as Page 03

---

**STATE A — LOCKED (Below 50%)**

Large lock card — white · 16px radius · border · shadow · padding 28px · margin 16px 20px · centered content

🔒 lock icon 48px · `rgba(139,26,46,0.12)` background circle 72px · centered

"Warp Request Locked" — Playfair Display 600 20px dark · centered · margin-top 16px

"You can raise a warp request only after submitting 50% of your batch. This ensures enough progress before more material is given." — DM Sans 14px muted · centered · line-height 1.6 · max-width 300px · margin auto

**Progress section inside lock card:**

"Your current progress:" — DM Sans 500 14px muted · margin-top 20px

"3 of 8 sarees submitted" — Playfair Display 700 24px dark · centered

Progress bar: 12px height · 37.5% gold fill · full width inside card · 999px radius
"37.5% complete" — DM Mono 12px muted · right aligned

**How close section:**
`#F0E8D0` cream background · 10px radius · padding 12px 16px · margin-top 16px
"You need 1 more saree to unlock the warp request (50% = 4 sarees)" — DM Sans 13px dark · line-height 1.5
Progress to unlock: small secondary bar — dark track · burgundy fill showing progress towards 50% · 6px height

Locked button below card:
"🔒 Warp Request — Locked" — gray filled `#E0D5CC` · full width minus 40px · 56px height · 999px radius · DM Sans 600 15px `#8B7060` muted · not tappable

---

**STATE B — UNLOCKED (50% or more)**

**Unlocked notice:**
`rgba(30,102,64,0.10)` green background · green border · 12px radius · padding 14px 18px · margin 16px 20px
✓ checkmark icon green · "Warp Request Unlocked!" — DM Sans 600 15px green
"You have submitted 50% of your batch. You can now request additional raw material." — DM Sans 13px muted

**Progress shown:**
"4 of 8 sarees submitted" — Playfair Display 700 24px dark · centered
Progress bar: 50% gold fill · 12px height

---

**REQUEST FORM:**

White card · margin 0 20px · 16px radius · border · shadow · padding 20px

**Field 1 — Batch Reference:**
Auto-filled · read-only chip · "BATCH-086" DM Mono burgundy

**Field 2 — What material do you need:**
Label: "What material are you requesting?" — DM Sans 500 15px dark · mandatory
3 checkbox rows — large tap targets 48px each:
☐ "More Warp" — DM Sans 500 15px dark
☐ "More Resham" — DM Sans 500 15px dark
☐ "More Jari" — DM Sans 500 15px dark
Multiple selection allowed

**Field 3 — How much:**
Label: "How much do you need?" — DM Sans 500 15px dark
Appears per checked material:
"Warp amount (kg):" — number input · 56px · DM Mono 16px
"Resham amount (kg) and color:" — number input + color description text input

**Field 4 — Reason:**
Label: "Why do you need more material?" — DM Sans 500 15px dark
Textarea · 100px height · `#FFF8E7` background · 14px radius
Placeholder: "Example: Extra sarees needed for a big order"

**Submit button:**
"📤 Send Warp Request" — burgundy filled · full width minus 40px · 56px height · 999px radius · DM Sans 600 15px white · icon + text

**After submit — success:**
Green checkmark · "Request Sent!" Playfair 600 20px
"Your request has been sent to the worker staff, admin, and superadmin. You will be notified when a decision is made." — DM Sans 14px muted

---

**PREVIOUS REQUESTS LIST:**

Section title: burgundy bar + "Your Previous Requests"

Each request — compact card:
Date · Material requested · Status badge:
"⏳ Pending" gold · "✓ Approved" green · "✗ Rejected" crimson

3 sample rows:
10 Jun 2026 · 3 kg Warp · ✓ Approved · green
05 Jun 2026 · Resham Red 500g · ✗ Rejected · crimson
01 Jun 2026 · 2 kg Warp · ✓ Approved · green

---

## PAGE 05 — MY PAYMENT LEDGER

Tab active: Payments

---

**HERO HEADER — Dark:**
Eyebrow: "SINCE 1999 · MY EARNINGS"
Heading: "My Payment Ledger" — Playfair Display 700 32px white
Sub: "Earnings, deductions, balance" — Playfair Display 500 italic 18px gold

---

**THIS MONTH SUMMARY — prominent card:**

White card · margin 16px 20px · 16px radius · border · shadow medium · padding 22px

**Month label:** "May 2026" — DM Mono 11px muted · centered

**3 large number rows:**

Row 1: "Sarees Produced:" label DM Sans 500 14px muted · "18 sarees · 17 passed QC" — Playfair Display 600 20px dark · right
Row 2: "Gross Making Charges:" label · "₹8,100" — Playfair Display 700 28px gold · right · large
Row 3: "Total Deductions:" label · "₹450" — Playfair Display 600 20px crimson · right

Divider line

**Net amount — large and prominent:**
"Net Amount to Be Paid:" — DM Sans 600 15px dark
"₹7,650" — Playfair Display 700 36px `#1E6640` green · centered · very large
Sub: "This is what you will receive this month" — DM Sans 13px muted · centered

Payment status:
If not yet paid: "⏳ Payment Pending — Expected by month end" — gold chip
If paid: "✓ Paid on 22 May 2026 · UTR: UTR202605189824" — green chip · DM Mono 11px

---

**DEDUCTIONS BREAKDOWN — Full Transparency:**

Section title: burgundy bar + "Deductions Applied This Month"

Sub: "These are the amounts deducted from your gross making charges." — DM Sans 13px muted

**Each deduction — detailed card:**

White card · margin 0 20px 10px · 12px radius · border · crimson left border 3px · padding 14px 16px

Card content:
Top row: "Defective Saree Deduction" — DM Sans 600 14px crimson · "₹450" — DM Mono 600 16px crimson · right
Saree ID: "PADMA-L1-004" — DM Mono 12px burgundy
Defect type: "Thread Break" — crimson pill chip DM Mono 10px
"QC Date: 10 Jun 2026" — DM Sans 12px muted
"Defect photo was sent to you via WhatsApp" — DM Sans 12px muted italic

If material deduction:
"Raw Material Shortfall Deduction" — DM Sans 600 14px crimson
"₹X" — DM Mono 600 16px crimson
"Weight was Xg below standard — deduction applied" — DM Sans 12px muted

**If no deductions:**
Green card: "✓ No deductions this month — excellent work!" — DM Sans 500 14px green · centered

---

**PAST MONTHS HISTORY:**

Section title: burgundy bar + "Payment History" + "See All →" gold right link

Each month row — compact card:
Month label DM Sans 600 14px dark · Sarees count DM Sans 13px muted · Amount DM Mono 600 14px gold · UTR if paid DM Mono 10px muted

Row 1: Apr 2026 · 15 sarees · ₹6,300 · ✓ Paid · UTR202604301122
Row 2: Mar 2026 · 12 sarees · ₹5,040 · ✓ Paid · UTR202603281456
Row 3: Feb 2026 · 18 sarees · ₹7,560 · ✓ Paid · UTR202602271234

**Payment notification note:**
Cream strip · `#F0E8D0` · 10px radius · padding 10px 14px · margin 0 20px
"🔔 You will receive a WhatsApp message and in-app notification when your payment is credited each month." — DM Sans 13px muted

---

## PAGE 06 — NOTIFICATIONS

Tab: accessed via bell icon in global header — not in bottom tab bar

---

**HERO HEADER — Dark:**
Eyebrow: "SINCE 1999 · NOTIFICATIONS"
Heading: "Notifications" — Playfair Display 700 32px white
Sub: "All alerts and confirmations" — Playfair Display 500 italic 18px gold

**Mark all as read link:** "Mark all as read" — DM Sans 500 13px gold · right aligned below header

---

**GROUP 1 — BATCH NOTIFICATIONS:**

Section title: burgundy bar + "Batch & Material Updates"

Notification cards stacked · white · 12px radius · border · padding 14px 16px · margin 0 20px 8px
Unread: `rgba(139,26,46,0.04)` subtle burgundy tint background · unread dot 8px burgundy left
Read: white background · no dot

Each notification:
Icon circle 36px · background matches type · icon from dashboard set
Right of icon: notification text DM Sans 500 14px dark · timestamp DM Mono 10px muted below

Notifications in this group:
🟢 "New batch assigned — BATCH-086 is ready. Materials have been issued." · Today · 9:00 AM
🟡 "Material issued — Please confirm receipt and sign to open BATCH-086." · Today · 9:05 AM
🔴 "Defect found — Saree PADMA-L1-004 from BATCH-086 failed QC. Thread break defect. Photo sent to WhatsApp." · 10 Jun · 11:30 AM
🟠 "Weight deduction — ₹280 deducted from BATCH-072. Weight was 780g, standard is 850g." · 05 Jun · 2:15 PM

---

**GROUP 2 — PAYMENT NOTIFICATIONS:**

Section title: burgundy bar + "Payment Updates"

Notifications:
💚 "Payment credited — ₹6,300 for April 2026 has been credited. UTR: UTR202604301122. Check your bank." · 01 May · 9:02 AM
💛 "Payment being processed — Your May 2026 payment of ₹7,650 will be credited by month end." · 25 May · 10:00 AM

---

**GROUP 3 — WARP REQUEST NOTIFICATIONS:**

Section title: burgundy bar + "Warp Request Updates"

Notifications:
✅ "Warp request approved — Your request for 3 kg Warp for BATCH-089 has been approved. Material will be issued soon." · 10 Jun · 12:00 PM
❌ "Warp request rejected — Your request for Resham Red 500g for BATCH-086 was rejected. Contact your supervisor for details." · 05 Jun · 3:30 PM

---

**CHRONOLOGICAL VIEW TOGGLE:**

Below grouped view — toggle link:
"Switch to Chronological View" — DM Sans 500 12px gold link

When switched: all notifications in one list, newest first, grouped label removed. Toggle back: "Switch to Grouped View"

---

## IMPORTANT DESIGN NOTES

**1 — Match Admin dashboard visual identity exactly:**
Same Playfair Display headings, same dark `#3D0E1A` headers with gold eyebrow text, same dark stats strips, same white cards with `rgba(139,26,46,0.12)` borders, same gold `#C4923A` accent, same burgundy `#6B1A2A` primary. Study the Superadmin dashboard screenshot carefully for font weights and color usage.

**2 — Simpler but not different:**
Fewer elements per screen. More white space. Larger text (minimum 15px DM Sans). Larger buttons (minimum 56px). Same visual language — just less dense.

**3 — Progress is always visual:**
Every batch progress is shown as a Playfair Display large number + gold progress bar. Never just text. Weavers understand numbers and visual bars better than status labels.

**4 — Deductions are fully transparent:**
Every deduction shows exact Saree ID + defect type + QC date. Weavers have the right to know exactly what was deducted and why.

**5 — Signature supports both methods:**
Sign on worker's phone OR sign on weaver's own phone. Both flows designed and accessible on Page 02.

**6 — Warp request shows both locked and unlocked states:**
Both states designed on Page 04. Progress bar showing how close to 50% even in locked state.

**7 — Design Library accessible from Page 01 and Page 03:**
Not a separate page — integrated into My Batches (bottom section) and Color Slip page (bottom section).

**8 — Jari always shows both units:**
"8 Reels (2 Buns)" — always both. Consistent with all other portals.

**9 — Firm name:** Beere Kesava & Brothers Silks · Est. 1999

**10 — Icons:** Same icon set across all portals — no new styles introduced.

---

## DELIVERABLE

6 complete mobile screens (390px wide):
1. My Batches — with active batches, history, design library section
2. Confirm Material Receipt — materials list, color slip review, signature (both methods), confirm button
3. View Color Slip — full image with zoom, design details, design library section
4. Raise Warp Request — locked state + unlocked state + previous requests
5. My Payment Ledger — this month summary, deductions with full transparency, payment history
6. Notifications — grouped by type with chronological toggle

---

Paste this into Figma Make and attach all existing portal screenshots as reference. After this is approved — the final portal is Shop Staff. Also pending: Worker Staff signature fix prompt.