Perfect. All answers are clear. Here is the complete Prompt 4.

---

## FIGMA MAKE PROMPT 4
### Superadmin Portal — Audit Log Page
### Beere Kesava & Brothers Silks ERP · Est. 1999

---

You are designing the **Audit Log page** — the third and final exclusive Superadmin page accessed via the "More ⋯" dropdown — for the **Beere Kesava & Brothers Silks ERP (Est. 1999)**. This page does not exist in the Admin portal. It is exclusively for the Superadmin. Attach all existing Superadmin page screenshots as visual reference to match the exact design language.

---

## DESIGN SYSTEM — Apply Exactly

**Colors:**
Background: `#FFFFFF` · Primary burgundy: `#6B1A2A` · Dark section: `#3D0E1A` · Gold: `#C4923A` · Green: `#1E6640` · Crimson: `#C0392B` · Text: `#1A0A0F` · Muted: `#8B7060` · Card border: `rgba(139,26,46,0.12)` · Cream: `#F0E8D0`

**Typography:**
Playfair Display — large numbers and headings
DM Sans — all UI text, labels, descriptions, buttons
DM Mono — all codes, IDs, timestamps, data values

**Cards:** White background · `1px solid rgba(139,26,46,0.12)` border · 14–16px border radius · `box-shadow 0 2px 12px rgba(44,24,16,0.07)`

**Section title pattern:** 4px burgundy vertical bar left + DM Sans 600 16px title + gold right link

**Buttons:** Always icon + text label — never icon alone

**Icons:** Use the same dashboard icon set and style already established across all existing Superadmin pages. Match icon weight, size, and visual language exactly. Do not introduce new icon styles.

---

## NAVIGATION

Active state: "More ⋯" dropdown open · "📋 Audit Log" item highlighted
Gold "SA" avatar top right · "Superadmin" text
Dropdown shows:
- ⚙ "Rates & Pricing"
- ✓ "Approvals"
- 📋 "Audit Log" — highlighted active

---

## PAGE HEADER — Compact Dark

Full width · Background: `#3D0E1A` · Height: approximately 140px

**Left side:**
Eyebrow: "SINCE 1999 · SUPERADMIN · AUDIT LOG" — DM Mono 9px uppercase letter-spacing 3px rgba white 50%
Heading: "Audit Log" — Playfair Display 700 42px white
Sub: "& System Activity" — Playfair Display 500 italic 28px gold
Description: "A complete permanent record of every action taken by every user across the entire system. This log cannot be edited or deleted by anyone — including the Superadmin." — DM Sans 400 14px rgba white 60% max-width 520px

**Right side — 3 stat chips:**
"2,840 Total Log Entries"
"Live — Updates in Real Time"
"All Time · From System Start"

Decorative circle outlines bottom right — same as all other page headers

---

## STATS STRIP — Dark Burgundy

5 columns · same dark strip pattern

**Column 1:**
Label: "TOTAL ACTIONS LOGGED"
Number: "2,840" — Playfair Display 700 32px white
Below: "From day one of the system"

**Column 2:**
Label: "ACTIONS TODAY"
Number: "48" — white Playfair 700 32px
Below: "↑ Live · Updates in real time"

**Column 3 — HIGHLIGHTED GOLD:**
Label: "MOST ACTIVE USER TODAY"
Number: "Admin (BK)" — Playfair Display 700 22px dark
Below: "18 actions · Last active 12 mins ago"

**Column 4:**
Label: "LOGIN SESSIONS TODAY"
Number: "12" — white Playfair 700 32px
Below: "Across all 5 roles"

**Column 5:**
Label: "LAST ACTION RECORDED"
Number: "2 mins ago" — white Playfair 700 22px
Below: "Worker Staff · Material issued · BATCH-089"

---

## LIVE UPDATE INDICATOR STRIP

Full width · `rgba(30,102,64,0.08)` green tint background · `1px solid rgba(30,102,64,0.20)` border · 10px radius · padding 10px 20px · margin-bottom 20px

Left: Green pulsing dot — 8px · `#1E6640` · with subtle pulse animation ring
"🟢 Live — New entries appear automatically as actions happen across the system." — DM Sans 500 13px dark

Right: "⟳ Last refreshed: just now" — DM Mono 10px muted · "Refresh Now" ghost small button · icon + text

---

## SEARCH AND FILTER BAR

White card · 14px radius · border · shadow sm · padding 18px 20px · margin-bottom 24px

**Title row:**
"Search and Filter Audit Log" — DM Sans 600 14px dark · left
"📥 Export" — gold ghost button right · icon + text · clicking shows two options: "📄 Export as PDF" and "📊 Export as Excel"

**Filter row 1 — Search inputs:**
Four inputs in a row:

Input 1 — Search by user or action:
🔍 "Search by user name, action, or description..." — DM Sans 13px · white background · 1px border · 12px radius · height 40px · width 35%

Input 2 — Filter by role:
"Filter by Role ▾" — dropdown · "All Roles" default · options: All Roles · Superadmin · Admin · Worker Staff · Finishing Staff · Shop Staff

Input 3 — Filter by module:
"Filter by Module ▾" — dropdown · "All Modules" default · options: All · Materials · Weavers · Production · Payments · Reports · Customers · Login

Input 4 — Filter by action type:
"Filter by Action ▾" — dropdown · "All Actions" default · options: All · Login · Logout · Data Entry · Edit · Approval · Rejection · Payment Recorded · QC Result · Dispatch

**Filter row 2 — Date range:**
Left: "From:" date picker + "To:" date picker — pre-filled with today's date range
Quick pills: "Today" (active) · "This Week" · "This Month" · "Last 3 Months" · "All Time"

Right: "🔍 Apply Filters" — burgundy filled button · icon + text
"✕ Clear All Filters" — ghost muted link

**Results count:**
"Showing 48 entries for today · 2,840 total entries in system" — DM Mono 11px muted · margin-top 8px

---

## VIEW TOGGLE

Two view buttons — top right of the log sections:
"☰ Timeline View" — active by default · burgundy filled · white text
"📋 Table View" — ghost · burgundy border · burgundy text

Both buttons have icon + text. Active one is burgundy filled. Inactive is ghost.

---

## SECTION 1 — ACTION LOG

Section title: burgundy bar + "Action Log — All System Activity" + "Download Action Log →" gold right link

Sub-label: "Every data entry, edit, approval, and system action made by all users. Updates in real time." — DM Sans 13px muted

---

### TIMELINE VIEW (Default)

Vertical timeline · Each entry is one logged action

**Timeline structure:**
Left side: vertical line in burgundy `rgba(139,26,46,0.25)` · continuous from top to bottom
Each entry: colored circle on the line · content to the right

**Entry circle colors by role:**
Superadmin actions: gold `#C4923A` circle
Admin actions: burgundy `#6B1A2A` circle
Worker Staff actions: green `#1E6640` circle
Finishing Staff actions: blue `#2C4A8B` circle
Shop Staff actions: dark `#2C1810` circle

**Each timeline entry layout:**
Left: colored circle 28px with role initial inside — white text DM Mono 10px
Right content block: white card · 12px radius · border · shadow sm · padding 14px 16px · margin-left 20px · margin-bottom 12px

**Card content — all details visible directly (no expand needed):**

Row 1: Role badge pill + User name + Timestamp
- Role badge: colored pill matching circle color · DM Mono 9px uppercase · "ADMIN" or "WORKER STAFF" etc.
- User name: DM Sans 600 13px dark · "Admin (BK)" or "Worker Staff (Ravi)"
- Timestamp: DM Mono 10px muted right-aligned · "Today · 11:42 AM"

Row 2: Action description — full plain language
- DM Sans 500 13px dark · "Issued 4.5 kg Warp and 800g Resham Red to weaver Padma Veni for BATCH-086"
- OR "Approved Purchase Order PO-2026-022 for Sri Venkateswara Textiles · ₹1,40,000"
- OR "Recorded retail sale of saree PADMA-L1-001 to Smt. Annapurna Devi · ₹8,500"

Row 3 (if edit action): Old value → New value
- "Changed from:" + old value in `#C0392B` crimson · "→" gold arrow · "Changed to:" + new value in `#1E6640` green
- Example: "Changed from: ₹420/saree → Changed to: ₹450/saree · Self Brocade SB-001"

Row 4: Module tag + Record reference
- Module: small chip — "MATERIALS" or "PAYMENTS" or "PRODUCTION" — DM Mono 8px · `#F0E8D0` cream background · burgundy border
- Record: DM Mono 10px burgundy · "BATCH-086" or "PO-2026-022" or "SAR-PADMA-L1-001"

---

**12 timeline entries — mix of all roles and action types:**

Entry 1 — Green circle (Worker Staff):
WORKER STAFF · Ravi Kumar · Today · 11:42 AM
"Issued 4.5 kg Warp, Resham Red 800g, and Jari PLY-2G-Gold 6 Reels to weaver Padma Veni"
Module: MATERIALS · Record: BATCH-086

Entry 2 — Burgundy circle (Admin):
ADMIN · Admin (BK) · Today · 11:38 AM
"Approved warp request from weaver Suresh Murti — 4 kg Warp for BATCH-081"
Module: WEAVERS · Record: BATCH-081

Entry 3 — Gold circle (Superadmin):
SUPERADMIN · Superadmin · Today · 11:30 AM
"Changed making charge rate for Self Brocade SB-001"
Changed from: ₹420/saree → Changed to: ₹450/saree
Module: RATES · Record: SB-001

Entry 4 — Dark circle (Shop Staff):
SHOP STAFF · Shop Staff (SS) · Today · 11:15 AM
"Recorded retail sale — saree PADMA-L1-001 sold to Smt. Annapurna Devi · ₹8,500"
Module: SALES · Record: SALE-2026-0231

Entry 5 — Blue circle (Finishing Staff):
FINISHING STAFF · Finishing (FS) · Today · 10:58 AM
"Completed quality check for BATCH-079 — 6 sarees passed · 0 rejected"
Module: PRODUCTION · Record: BATCH-079

Entry 6 — Green circle (Worker Staff):
WORKER STAFF · Worker (WS) · Today · 10:45 AM
"Received 50 kg Warp from Sri Venkateswara Textiles — GRN created"
Module: MATERIALS · Record: SRI-WARP-001

Entry 7 — Burgundy circle (Admin):
ADMIN · Admin (MK) · Today · 10:30 AM
"Created Purchase Order PO-2026-022 for Sri Venkateswara Textiles · ₹1,40,000"
Module: MATERIALS · Record: PO-2026-022

Entry 8 — Gold circle (Superadmin):
SUPERADMIN · Superadmin · Today · 10:15 AM
"Approved Purchase Order PO-2026-021 for Kanchipuram Silks · ₹3,75,000"
Module: APPROVALS · Record: PO-2026-021

Entry 9 — Green circle (Worker Staff):
WORKER STAFF · Worker (WS) · Today · 9:55 AM
"Recorded QC defect on saree RAVI-L2-008 — Thread break defect · Making charge zeroed"
Module: PRODUCTION · Record: RAVI-L2-008

Entry 10 — Burgundy circle (Admin):
ADMIN · Admin (RK) · Today · 9:40 AM
"Added new bulk order — Lakshmi Silks · 80 sarees · Design BKB-045 · Due 28 May 2026"
Module: CUSTOMERS · Record: ORD-2026-041

Entry 11 — Dark circle (Shop Staff):
SHOP STAFF · Shop Staff (SS) · Today · 9:20 AM
"Processed return — saree PADMA-L1-002 returned by Smt. Lakshmi Bai"
Module: SALES · Record: RET-2026-0021

Entry 12 — Blue circle (Finishing Staff):
FINISHING STAFF · Finishing (FS) · Today · 9:05 AM
"Dispatched 6 sarees to Lakshmi Silks — INV-2026-041 · LR uploaded"
Module: PRODUCTION · Record: INV-2026-041

**"Load More Entries ▾" button** — ghost burgundy · centered · below timeline

---

### TABLE VIEW (Toggle state)

When "📋 Table View" is selected — timeline hides and table appears

White card · 16px radius · shadow · full width

**Column headers — DM Mono 9px uppercase muted:**
Timestamp · Role · User · Module · Action · Record ID · Old Value · New Value

**Column styling:**
Timestamp: DM Mono 11px muted · "11 Jun · 11:42 AM"
Role: colored pill badge — matching role colors
User: DM Sans 600 12px dark
Module: DM Mono 10px chip · cream background · burgundy border
Action: DM Sans 13px dark · full description · two lines if needed
Record ID: DM Mono 11px burgundy
Old Value: DM Sans 12px crimson · "—" if not an edit action
New Value: DM Sans 12px green · "—" if not an edit action

**Same 12 entries as timeline — shown as table rows**

Row hover: `#F0E8D0` subtle cream background

**Pagination:** Previous · 1 · 2 · 3 · ... · 60 · Next
"Showing 1–20 of 2,840 entries" — DM Mono 11px muted left
"Rows per page: 20 ▾" — right

---

## SECTION 2 — LOGIN HISTORY

Section title: burgundy bar + "Login History — All Sessions" + "Download Login Log →" gold right link

Sub-label: "Every login and logout event across all user accounts. Updates in real time." — DM Sans 13px muted

**View toggle — same style as Action Log:**
"☰ Timeline View" · "📋 Table View"

---

### LOGIN TIMELINE VIEW (Default)

Same vertical timeline structure as Action Log but with login-specific styling

**Login entry circle colors:**
Successful login: green `#1E6640`
Logout: muted `#8B7060`
Failed login attempt: crimson `#C0392B`

**Each login entry card content:**

Row 1: Status badge + User + Timestamp
- "✓ Login" green badge OR "→ Logout" muted badge OR "✗ Failed Login" crimson badge
- User name and role: DM Sans 600 13px dark
- Timestamp: DM Mono 10px muted right

Row 2: Session details
- Device type icon from dashboard icon set + "Web Browser" or "Mobile" — DM Sans 12px muted
- Session duration (for logout entries): "Session: 2 hours 14 minutes" — DM Mono 11px muted

Row 3 (for failed login only):
- "Failed attempt — incorrect OTP entered" — DM Sans 12px crimson
- Attempt count if multiple: "Attempt 2 of 3" — DM Mono 10px crimson

---

**10 login timeline entries:**

Entry 1 — Green circle:
✓ Login · Superadmin · Today · 9:00 AM
Web Browser · Session ongoing

Entry 2 — Green circle:
✓ Login · Admin (BK) · Today · 9:05 AM
Web Browser · Session ongoing

Entry 3 — Green circle:
✓ Login · Worker Staff (WS) · Today · 8:45 AM
Mobile · Session ongoing

Entry 4 — Muted circle:
→ Logout · Admin (RK) · Today · 8:40 AM
Web Browser · Session: 3 hours 12 minutes

Entry 5 — Green circle:
✓ Login · Admin (RK) · Today · 8:38 AM
Web Browser · Session ongoing

Entry 6 — Green circle:
✓ Login · Finishing Staff (FS) · Today · 8:30 AM
Mobile · Session ongoing

Entry 7 — Crimson circle:
✗ Failed Login · Unknown · Today · 8:25 AM
Mobile · Failed attempt — incorrect OTP · Attempt 1 of 3

Entry 8 — Green circle:
✓ Login · Shop Staff (SS) · Today · 8:20 AM
Mobile + Tablet · Session ongoing

Entry 9 — Muted circle:
→ Logout · Worker Staff (WK2) · Yesterday · 6:45 PM
Mobile · Session: 8 hours 20 minutes

Entry 10 — Green circle:
✓ Login · Admin (MK) · Yesterday · 9:10 AM
Web Browser · Session: 9 hours 35 minutes

---

### LOGIN TABLE VIEW

**Column headers:**
Timestamp · User · Role · Event · Device · Session Duration · Status

**Same 10 entries as timeline — table rows**

**Styling:**
Event column: "✓ Login" green text · "→ Logout" muted · "✗ Failed" crimson
Session Duration: DM Mono 11px · "Ongoing" gold if still active · duration if logged out · "—" if failed
Status: colored pill — "Active" green · "Ended" muted · "Failed" crimson

---

## IMMUTABILITY NOTICE — Bottom of Page

Full width · `rgba(44,24,16,0.05)` dark tint background · `1px solid rgba(44,24,16,0.12)` border · 12px radius · padding 16px 22px · margin-top 32px

Left: Lock icon from dashboard icon set · "🔒 This audit log is permanent and immutable." — DM Sans 600 13px dark
Below: "No one — including the Superadmin — can edit, delete, or modify any entry in this log. Every action recorded here is final and permanent. This log is your legal and operational record." — DM Sans 400 12px muted · line-height 1.6

Right: "📥 Export Full Log" — burgundy ghost button · icon + text
Below export button: "PDF · Excel" — DM Mono 9px muted

---

## FOOTER

Same footer as all other Superadmin pages — Beere Kesava & Brothers Silks · Est. 1999

---

## COMPLETE PAGE SCROLL ORDER

1. Navigation — More ⋯ dropdown · Audit Log active
2. Page Header — compact dark
3. Stats Strip — dark 5 columns
4. Live Update Indicator Strip — green pulsing
5. Search and Filter Bar — full search with all filters
6. View Toggle — Timeline / Table
7. Section 1 — Action Log (Timeline default · Table toggle)
8. Section 2 — Login History (Timeline default · Table toggle)
9. Immutability Notice — bottom strip
10. Footer

---

## IMPORTANT DESIGN NOTES

**1 — Both views designed and shown:**
Design both Timeline View and Table View for both sections — all 4 states visible on the page in Figma. In the live product the toggle switches between them. In the design all are shown stacked so all states are visible.

**2 — Real time feel:**
The live update indicator with the pulsing green dot and "Last refreshed: just now" text communicates that this is a live feed. The most recent entry always appears at the top of the timeline.

**3 — Role colors are consistent:**
The same role colors used across the entire dashboard — gold for Superadmin, burgundy for Admin, green for Worker Staff, blue for Finishing Staff, dark for Shop Staff — are used for the timeline circles and role badges. This creates instant visual recognition of who did what.

**4 — Immutability is communicated clearly:**
No edit buttons anywhere on this page. No delete buttons. The immutability notice at the bottom reinforces this. The table has no action column. The timeline has no edit option on hover.

**5 — Plain language throughout:**
Every action description is written in full plain words. "Issued 4.5 kg Warp to weaver Padma Veni" not "Material Issue · BATCH-086". "Recorded retail sale of saree" not "POS Transaction". The log must be readable by any admin brother without technical knowledge.

**6 — Export is always accessible:**
The export button is in the search bar (always visible) and also in the immutability notice at the bottom. Admin should never have to hunt for the download option.

**7 — Icons match dashboard:**
Every icon on this page — timeline circles, role badges, device icons, lock icon, export icon, search icon — must match the dashboard icon set exactly as established in the existing Superadmin pages.

**8 — Firm name:** Beere Kesava & Brothers Silks · Est. 1999

---

Paste this into Figma Make and attach all existing Superadmin page screenshots as reference. This is Prompt 4 of 4 — the final prompt for the complete Superadmin portal. After this is generated and approved the full Superadmin portal is complete and you can move to the Worker Staff portal.