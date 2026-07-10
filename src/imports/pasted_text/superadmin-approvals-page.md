Perfect. All answers are clear. Here is the complete Prompt 3.

---

## FIGMA MAKE PROMPT 3
### Superadmin Portal — Approvals Page
### Beere Kesava & Brothers Silks ERP · Est. 1999

---

You are designing the **Approvals page** — the second of 3 exclusive Superadmin pages accessed via the "More ⋯" dropdown — for the **Beere Kesava & Brothers Silks ERP (Est. 1999)**. This page does not exist in the Admin portal. It is exclusively for the Superadmin. Attach all existing Superadmin page screenshots as visual reference to match the exact design language.

---

## DESIGN SYSTEM — Apply Exactly

**Colors:**
Background: `#FFFFFF` · Primary burgundy: `#6B1A2A` · Dark section: `#3D0E1A` · Gold: `#C4923A` · Green: `#1E6640` · Crimson: `#C0392B` · Text: `#1A0A0F` · Muted: `#8B7060` · Card border: `rgba(139,26,46,0.12)` · Cream: `#F0E8D0`

**Typography:**
Playfair Display — large numbers and headings
DM Sans — all UI text, labels, descriptions, buttons
DM Mono — all codes, IDs, data labels

**Cards:** White background · `1px solid rgba(139,26,46,0.12)` border · 14–16px border radius · `box-shadow 0 2px 12px rgba(44,24,16,0.07)`

**Section title pattern:** 4px burgundy vertical bar left + DM Sans 600 16px title + gold right link

**Buttons:** Always icon + text label — never icon alone
Approve button: `#1E6640` green filled · 999px radius · padding 8px 20px · DM Sans 600 13px white · "✓ Approve" icon + text
Reject button: ghost · `1px solid #C0392B` crimson border · `#C0392B` crimson text · 999px radius · same padding · "✗ Reject" icon + text
Bulk approve: `#1E6640` green filled · full width or prominent · "✓ Approve All" icon + text

**Icons:** Use the same dashboard icon set and style already established across all existing Superadmin pages. Match icon weight, size, and visual language exactly. Do not introduce new icon styles.

---

## NAVIGATION

Active state: "More ⋯" dropdown open · "✓ Approvals" item highlighted
Gold "SA" avatar top right · "Superadmin" text
Dropdown shows:
- ⚙ "Rates & Pricing"
- ✓ "Approvals" — highlighted active
- 📋 "Audit Log"

---

## PAGE HEADER — Compact Dark

Full width · Background: `#3D0E1A` · Height: approximately 140px

**Left side:**
Eyebrow: "SINCE 1999 · SUPERADMIN · APPROVALS" — DM Mono 9px uppercase letter-spacing 3px rgba white 50%
Heading: "Approvals" — Playfair Display 700 42px white
Sub: "& Pending Actions" — Playfair Display 500 italic 28px gold
Description: "Review and approve or reject all pending requests — purchase orders, weaver warp requests, and admin rate change requests. Your approval is required before any of these actions take effect." — DM Sans 400 14px rgba white 60% max-width 520px

**Right side — 3 stat chips:**
"3 Purchase Orders Pending"
"3 Warp Requests Pending" — crimson tint chip
"2 Rate Change Requests Pending"

Decorative circle outlines bottom right — same as all other page headers

---

## STATS STRIP — Dark Burgundy

4 columns · same dark strip pattern

**Column 1:**
Label: "TOTAL PENDING APPROVALS"
Number: "8" — Playfair Display 700 32px white
Below: "Require your action today"

**Column 2:**
Label: "PURCHASE ORDERS PENDING"
Number: "3" — white Playfair 700 32px
Below: "From admin · Awaiting your approval"

**Column 3 — HIGHLIGHTED GOLD:**
Label: "WARP REQUESTS PENDING"
Number: "3" — dark Playfair 700 32px
Below: "From weavers · Oldest: 2 days ago"

**Column 4:**
Label: "RATE CHANGE REQUESTS"
Number: "2" — crimson `#C0392B` Playfair 700 32px
Below: "⚠ From admin · Pending review"

---

## APPROVAL TABS — Sticky Below Stats Strip

Three tabs in a row. Sticky — stays visible as Superadmin scrolls.
Full width white background · bottom border divider line

**Tab 1:** "📦 Purchase Orders (3)" — active by default
**Tab 2:** "🪡 Warp Requests (3)"
**Tab 3:** "💰 Rate Change Requests (2)"

Active tab: burgundy `#6B1A2A` filled background · white text · 2px bottom border gold
Inactive tabs: white background · dark text · no border

Each tab shows the count in brackets — updates dynamically as items are approved or rejected

---

## TAB 1 — PURCHASE ORDERS

### BULK ACTION STRIP

Full width · `#F0E8D0` cream background · 12px radius · padding 12px 20px · margin-bottom 20px · flex row space-between

Left: "3 purchase orders are waiting for your approval." — DM Sans 500 13px dark
Right: "✓ Approve All 3 Purchase Orders" — `#1E6640` green filled button · 999px radius · padding 8px 20px · DM Sans 600 13px · icon + text

---

### PURCHASE ORDER CARDS — 3 cards

Each PO card:
White background · 16px radius · subtle border · shadow sm
Left border 4px — gold `#C4923A` for pending

**Card top row:**
Left: PO number chip — DM Mono 12px burgundy · `rgba(139,26,46,0.10)` background · 999px radius · padding 4px 12px
Right: Date raised — "Raised 2 days ago" — DM Mono 10px muted chip · cream background

**Vendor info row:**
Vendor icon from dashboard icon set · Vendor name: Playfair Display 600 16px dark
Below: Vendor code · city — DM Mono 10px muted

**Status banner full width:**
`rgba(196,146,58,0.10)` gold background · padding 8px 14px
"⏳ Waiting for your approval — Admin submitted this purchase order and is waiting." — DM Sans 500 12px gold

**Material ordered — clear rows:**
Each row: material icon + "Material:" label DM Sans 500 13px muted + quantity DM Sans 600 14px dark
Row 1: 📦 "Warp:" + "50 kg"
Row 2: 🪡 "Resham:" + "Red · 30 kg · Gold · 25 kg"
Row 3: ✨ "Jari:" + "Polyester 2G Gold · 6 Buns (24 Reels)"

**Estimated cost row:**
"Estimated Total Cost:" — DM Sans 500 13px muted · "₹1,40,000" — Playfair Display 600 20px gold

**Current stock note:**
Small info strip inside card — cream background `#F0E8D0` · 8px radius · padding 8px 12px
"Current stock of this material: Warp 142 kg · Resham Red 22 kg · Resham Gold 15 kg" — DM Sans 11px muted
This gives Superadmin context to decide if the order is needed

**Raised by row:**
"Raised by:" — DM Sans 12px muted · "Admin (BK)" — DM Sans 600 12px dark

**Two action buttons — full width side by side:**
"✓ Approve — Send PO to Vendor" — green filled · full width left · icon + text
"✗ Reject" — crimson ghost · full width right · icon + text

---

**3 PO cards data:**

**Card 1 — PO-2026-022:**
Raised 2 days ago · Sri Venkateswara Textiles · Ongole, AP
Warp: 50 kg · Estimated: ₹1,40,000
Current stock: Warp 142 kg
Raised by: Admin (BK)

**Card 2 — PO-2026-021:**
Raised 1 day ago · Kanchipuram Silks · Kanchipuram, TN
Resham Red: 30 kg · Resham Gold: 25 kg · Estimated: ₹3,75,000
Current stock: Resham Red 22 kg · Resham Gold 15 kg
Raised by: Admin (RK)

**Card 3 — PO-2026-020:**
Raised today · Surat Zari Works · Surat, GJ
Jari Polyester 2G Gold: 6 Buns · Jari Silk Fast 1G Silver: 4 Buns · Estimated: ₹1,92,000
Current stock: PLY-2G-Gold 8 Buns · SF-1G-Silver 2 Buns
Raised by: Admin (MK)

---

## TAB 2 — WARP REQUESTS

### BULK ACTION STRIP

"3 warp requests are waiting for your approval. Check each weaver's batch progress before approving." — DM Sans 500 13px dark
Right: "✓ Approve All 3 Warp Requests" — green filled button · icon + text

---

### WARP REQUEST CARDS — 3 cards

Each card: White background · 16px radius · border · shadow sm
Left border 4px — green if weaver qualifies (50%+ done) · gold if borderline · crimson if not yet at 50%

**Card top row:**
Left: Weaver photo circle 48px (or initials if no photo) · Weaver first name + last name: Playfair Display 600 16px dark · Weaver code: DM Mono 10px burgundy below name
Right: Batch number chip — DM Mono 12px burgundy

**Date chip:**
"Request raised: 2 days ago" — DM Mono 10px cream chip

**Status banner:**
Green background `rgba(30,102,64,0.10)` if qualifies · "✓ Qualifies for warp request — 50% of batch completed"
Gold background if borderline · "⚠ Check progress before approving"
— DM Sans 500 12px · full width

**Material requested row:**
📦 "Material Requested:" — DM Sans 500 13px muted
Amount: "3 kg Warp" — DM Sans 600 14px dark
Reason: "Extra sarees for Lakshmi Silks order" — DM Sans 12px muted italic

**Batch progress — clear and large:**
"Batch progress:" — DM Sans 500 13px muted
"4 of 8 sarees done" — Playfair Display 600 20px dark
Progress bar: 8px height · 50% gold fill · light gray track
"50% complete — qualifies for warp request" — DM Mono 11px green below bar

**Current material stock:**
Small info strip · cream background · 8px radius · padding 8px 12px
"Warp currently in stock: 142 kg — enough to fulfil this request" — DM Sans 11px muted

**Design being worked on:**
🎨 "Design: BKB-045 · Self Brocade · SB-001 · ₹450/saree" — DM Sans 12px muted

**Two action buttons:**
"✓ Approve Request" — green filled · full width left · icon + text
"✗ Reject" — crimson ghost · full width right · icon + text

---

**3 warp request cards data:**

**Card 1 — Ravi Kumar (WV-001):**
BATCH-089 · Raised 2 days ago
3 kg Warp · Reason: Extra sarees for Lakshmi Silks order
Progress: 4 of 8 sarees (50%) · Green border — qualifies
Design: BKB-045 · SB-001
Stock: 142 kg available

**Card 2 — Padma Veni (WV-002):**
BATCH-086 · Raised 1 day ago
2 kg Warp + Resham Red 500g · Reason: Design change by admin
Progress: 3 of 5 sarees (60%) · Green border — qualifies
Design: BKB-031 · HZ-003
Stock: Warp 142 kg · Resham Red 22 kg available

**Card 3 — Suresh Murti (WV-007):**
BATCH-081 · Raised today
4 kg Warp · Reason: More sarees for stock
Progress: 2 of 4 sarees (50%) · Green border — qualifies
Design: BKB-022 · PS-002
Stock: 142 kg available

---

## TAB 3 — RATE CHANGE REQUESTS

### BULK ACTION STRIP

"2 rate change requests from admin are waiting for your review." — DM Sans 500 13px dark
Right: "✓ Approve All 2 Rate Changes" — green filled button · icon + text

---

### RATE CHANGE REQUEST CARDS — 2 cards

Each card: White background · 16px radius · border · shadow sm
Left border 4px — burgundy `#6B1A2A`

**Card top row:**
Left: Rate change icon from dashboard icon set · "Rate Change Request" — DM Sans 600 14px dark
Right: Date raised chip — DM Mono 10px cream chip

**Status banner:**
`rgba(139,26,46,0.08)` burgundy tint background · padding 8px 14px
"📋 Admin has requested a rate change. Review the details and approve or reject." — DM Sans 500 12px muted

**Change details — large and clear:**

What is being changed:
"Saree Type:" — DM Sans 500 13px muted · "Self Brocade · SB-001" — DM Sans 600 14px dark

Current rate vs requested rate — side by side two boxes:
Left box: `rgba(192,57,43,0.08)` crimson background · border crimson · 10px radius · padding 12px 16px · centered
"Current Rate" — DM Mono 9px uppercase crimson · margin-bottom 4px
"₹420 / saree" — Playfair Display 700 24px crimson

Arrow between boxes: "→" gold · font-size 20px

Right box: `rgba(30,102,64,0.10)` green background · border green · same style
"Requested Rate" — DM Mono 9px uppercase green
"₹450 / saree" — Playfair Display 700 24px green

**Impact note:**
"Difference: +₹30 per saree" — DM Sans 600 13px dark
"This affects all weavers currently producing Self Brocade sarees. Making charges will increase for future batches." — DM Sans 12px muted · line-height 1.5

**Raised by:**
"Requested by:" — DM Sans 12px muted · "Admin (BK)" — DM Sans 600 12px dark · "3 days ago" — DM Mono 10px muted

**Two action buttons:**
"✓ Approve Rate Change" — green filled · full width left
"✗ Reject" — crimson ghost · full width right

---

**2 rate change request cards:**

**Card 1:**
Self Brocade · SB-001
Current: ₹420/saree → Requested: ₹450/saree · Difference: +₹30
Requested by: Admin (BK) · 3 days ago
Reason given: "Market rate increase — raw material costs have gone up"

**Card 2:**
Heavy Zari · HZ-003
Current: ₹650/saree → Requested: ₹680/saree · Difference: +₹30
Requested by: Admin (MK) · 1 day ago
Reason given: "Weaver demand — skilled weavers asking for higher rate"

---

## APPROVAL HISTORY SECTION

**Below all three tabs — always visible regardless of which tab is active**

Section title: burgundy bar + "Approval History — All Past Decisions" + "Download History →" gold right link

Sub-label: "All approvals and rejections made by the Superadmin. This record is permanent and cannot be changed." — DM Sans 13px muted

**Filter pills:**
"All History" (active) · "Purchase Orders" · "Warp Requests" · "Rate Changes" · "Approved Only" · "Rejected Only"

**Period filter:** "This Month" (active) · "Last 3 Months" · "All Time"

---

### HISTORY TABLE

White card · 16px radius · shadow

**Column headers — DM Mono 9px uppercase muted:**
Date & Time · Request Type · Requested By · Details · Decision · Notified

**12 rows — mix of approved and rejected:**

Row 1: 10 Jun 2026 · 10:30 AM · Purchase Order · Admin (BK) · PO-2026-019 · Sri Venkateswara · ₹1,28,000 · ✓ Approved (green badge) · ✓ Notified
Row 2: 10 Jun 2026 · 10:15 AM · Warp Request · Weaver · Kamala B. · BATCH-079 · 2 kg Warp · ✓ Approved · ✓ Notified
Row 3: 09 Jun 2026 · 3:45 PM · Rate Change · Admin (MK) · Plain Silk PS-002 · ₹260→₹280 · ✓ Approved · ✓ Notified
Row 4: 09 Jun 2026 · 2:20 PM · Warp Request · Weaver · Lakshmi D. · BATCH-077 · 3 kg Warp · ✗ Rejected (crimson badge) · ✓ Notified
Row 5: 08 Jun 2026 · 11:00 AM · Purchase Order · Admin (RK) · PO-2026-018 · Mysore Silk Co. · ₹1,20,000 · ✓ Approved · ✓ Notified
Row 6: 08 Jun 2026 · 9:30 AM · Warp Request · Weaver · Venkat Rao · BATCH-074 · 4 kg Warp · ✗ Rejected · ✓ Notified
Row 7: 07 Jun 2026 · 4:10 PM · Rate Change · Admin (BK) · Bridal Special BS-004 · ₹1,150→₹1,200 · ✓ Approved · ✓ Notified
Row 8: 07 Jun 2026 · 2:00 PM · Purchase Order · Admin (MK) · PO-2026-017 · Surat Zari Works · ₹1,60,000 · ✓ Approved · ✓ Notified
Row 9: 06 Jun 2026 · 10:45 AM · Warp Request · Weaver · Anand K. · BATCH-071 · 2 kg Warp · ✓ Approved · ✓ Notified
Row 10: 05 Jun 2026 · 3:30 PM · Rate Change · Admin (RK) · Light Cotton LC-005 · ₹200→₹220 · ✓ Approved · ✓ Notified
Row 11: 04 Jun 2026 · 11:20 AM · Purchase Order · Admin (BK) · PO-2026-016 · Kanchipuram Silks · ₹2,80,000 · ✗ Rejected · ✓ Notified
Row 12: 03 Jun 2026 · 9:00 AM · Warp Request · Weaver · Meena R. · BATCH-068 · 3 kg Warp · ✗ Rejected · ✓ Notified

**Column styling:**
Date & Time: DM Mono 11px muted
Request Type: colored pill badge — burgundy for PO · gold for Warp · dark for Rate Change
Requested By: DM Sans 600 12px dark
Details: DM Sans 12px muted · two lines if needed
Decision: "✓ Approved" green filled pill · "✗ Rejected" crimson filled pill
Notified: "✓ Notified" green small text — confirms WhatsApp + in-app sent

**Immutable note below table:**
"🔒 This history is permanent and cannot be edited or deleted." — DM Mono 10px muted · right aligned

**Pagination:** Previous · 1 · 2 · 3 · Next

---

## EMPTY STATE — When All Approvals Are Done

If all 3 tabs have zero pending items — show a full width empty state card:
White card · 16px radius · centered content · padding 48px

Large checkmark icon from dashboard icon set · green `#1E6640` · 64px
"All caught up!" — Playfair Display 600 24px dark · margin-top 16px
"There are no pending approvals right now. All purchase orders, warp requests, and rate change requests have been reviewed." — DM Sans 400 13px muted · max-width 400px · centered · line-height 1.6

---

## FOOTER

Same footer as all other Superadmin pages — Beere Kesava & Brothers Silks · Est. 1999

---

## COMPLETE PAGE SCROLL ORDER

1. Navigation — More ⋯ dropdown · Approvals active
2. Page Header — compact dark
3. Stats Strip — dark 4 columns
4. Approval Tabs — sticky (PO · Warp Requests · Rate Changes)
5. Tab content — whichever tab is active (default: Purchase Orders)
6. Approval History — always visible below tabs
7. Footer

---

## IMPORTANT DESIGN NOTES

**1 — Show all 3 tab contents on the page:**
Design all three tab states visible on the page — Purchase Orders section · Warp Requests section · Rate Change Requests section — stacked one after the other so all content is visible in Figma. In the live product tabs switch. In the design all are shown.

**2 — Approve and Reject buttons are the most important elements:**
They must be the most visually prominent elements on every card. Green for approve — clear and confident. Crimson ghost for reject — present but not dominant. Superadmin should never accidentally reject when meaning to approve.

**3 — No rejection reason required:**
When Superadmin clicks Reject — no form opens. The rejection happens immediately. The card disappears from pending. Notification sent to requestor. This is intentional — keep the flow fast.

**4 — Bulk approve is prominent but not alarming:**
The "Approve All" button is visible and accessible but placed to the right — not centered — so it does not feel like the default action. Superadmin should feel they reviewed each item before using bulk approve.

**5 — Icons match dashboard:**
Use the same icon set already established across all Superadmin pages. Every icon — approve check, reject cross, pending clock, notification bell, purchase order package, warp thread, rate change — must match dashboard icon style exactly.

**6 — Firm name:** Beere Kesava & Brothers Silks · Est. 1999

---

Paste this into Figma Make and attach all existing Superadmin page screenshots as reference. This is Prompt 3 of 4. After this is approved — Prompt 4 covers the Audit Log page, completing the full Superadmin portal.