FIX PROMPT C
Admin Portal — 3 Additions
Dispatch Draft Inbox + Invoice Generator + Low Stock Alert + Dual Assignment Source
Beere Kesava & Brothers Silks ERP · Est. 1999

You are adding targeted features to the existing Admin Portal of the Beere Kesava & Brothers Silks ERP (Est. 1999). Attach all existing Admin portal screenshots as reference. Apply only the additions described. Do not change anything else.

DESIGN SYSTEM — Same as Admin Portal
Background: #FFFFFF · Burgundy: #6B1A2A · Dark: #3D0E1A · Gold: #C4923A · Green: #1E6640 · Crimson: #C0392B · Muted: #8B7060 · Cream: #F0E8D0
Fonts: Playfair Display · DM Sans · DM Mono
Cards: white · 1px solid rgba(139,26,46,0.12) · 14–16px radius · soft shadow
Section title: burgundy vertical bar + DM Sans 600 + gold right link
Buttons: always icon + text · Icons: same dashboard icon set — no new styles

ADDITION 1 — DISPATCH DRAFT INBOX
Add to: Payments page — new section inserted above the existing Payment History section

Section title: burgundy bar + "Dispatch Drafts — From Finishing Staff" + "View All Drafts →" gold right link
Sub-label: "Finishing staff have submitted these dispatch drafts. Review each one carefully. For shop dispatch — confirm to move stock. For wholesale dispatch — generate the invoice first then confirm." — DM Sans 13px muted

Alert strip — when drafts pending:
Gold background rgba(196,146,58,0.10) · gold border 1px · 12px radius · padding 12px 20px · margin-bottom 16px
"⚠ X dispatch drafts are waiting for your review." — DM Sans 500 13px gold · left
"View All →" — gold link right

SHOP DISPATCH DRAFT CARDS:
Sub-section label: "Shop Dispatch Drafts" — DM Sans 600 14px dark · margin-bottom 10px
Each shop draft card:
White card · 14px radius · border · shadow sm · green left border 4px
Card header row:
"🏪 Shop Dispatch Draft" — DM Sans 600 14px dark
"Submitted by Finishing Staff" — DM Mono 10px muted · right
Submitted time: "X hours ago" — DM Mono 10px muted chip · cream background
Card content:
Sarees row:
📦 "Sarees:" — DM Sans 500 13px muted
Saree IDs listed: DM Mono 11px burgundy · comma separated · line-wraps if many
Count chip: "6 sarees" — DM Mono 10px gold right
Transport row:
🚛 "LR Number:" — DM Sans 500 13px muted · "LR-2026-0234" DM Mono 12px dark
"Transport: Reliable Logistics · Vehicle: AP09 AB 1234" — DM Sans 12px muted
Date row:
📅 "Dispatch Date:" — DM Mono 12px dark
LR Document:
📄 "LR Document: Uploaded ✓" — DM Sans 12px green · tap to view thumbnail
Two action buttons full width side by side:
"✓ Confirm Shop Dispatch" — #1E6640 green filled · half width · 48px height · icon + text
"✏ Edit Draft" — ghost burgundy · half width · 48px height · icon + text
After confirming:

Stock moves from factory to shop automatically
Green success strip: "✓ Dispatch confirmed — factory stock reduced · shop stock increased"


WHOLESALE DISPATCH DRAFT CARDS:
Sub-section label: "Wholesale Dispatch Drafts" — DM Sans 600 14px dark · margin-bottom 10px · margin-top 20px
Each wholesale draft card:
White card · 14px radius · border · shadow sm · gold left border 4px
Card header row:
"🚚 Wholesale Dispatch Draft" — DM Sans 600 14px dark
Customer name + order reference: DM Sans 600 13px burgundy · right
Card content:
Customer row:
👤 "Customer:" — DM Sans 500 13px muted
"Lakshmi Silks · WHL-001 · ORD-2026-041" — DM Sans 600 13px dark
Sarees row:
Same as shop draft — IDs + count
Transport row:
Same as shop draft — LR + vehicle
Invoice status:
📋 "Invoice:" — DM Sans 500 13px muted
"Not yet generated" — DM Sans 500 13px gold · right · if not generated
OR "Generated — INV-2026-041 ✓" — DM Sans 500 13px green · right · if generated
Three action buttons:
"📄 Generate Invoice" — #6B1A2A burgundy filled · full width · 52px height · opens invoice generator modal
"✓ Confirm Dispatch" — #1E6640 green filled · full width · 48px height · only active after invoice generated
"✏ Edit Draft" — ghost burgundy · full width · 44px height
"Confirm Dispatch" inactive state:
Gray filled #E0D5CC · "Generate Invoice First — Then Confirm" — DM Sans 13px muted · not tappable
After confirming:

Payment tracking record created automatically
Customer notified via WhatsApp
Green strip: "✓ Dispatch confirmed — payment tracking started · customer notified"


2 sample draft cards:
Shop Draft 1:
Submitted 2 hours ago · 6 sarees (PADMA-L1-001 through 006)
LR-2026-0234 · Reliable Logistics · AP09 AB 1234 · 13 Jun 2026
LR document: Uploaded ✓
Wholesale Draft 1:
Lakshmi Silks · WHL-001 · ORD-2026-041
5 sarees (RAVI-L2-004 through 008)
LR-2026-0235 · Speed Transport · AP05 CD 5678 · 13 Jun 2026
Invoice: Not yet generated

ADDITION 2 — INVOICE GENERATOR MODAL
Triggered by: "Generate Invoice" button on any wholesale dispatch draft card

Modal design:
White background · 24px radius · box-shadow 0 20px 60px rgba(44,24,16,0.20) · max-width 860px · centered · dark overlay · close × button top right
Modal header — dark burgundy strip:
"Generate Wholesale Invoice" — Playfair Display 700 22px white
Customer name + order reference — DM Mono 12px gold below

TWO-PANEL LAYOUT:
Left panel (55%) — Invoice Form:
Auto-filled from dispatch draft — read only (shown as info chips):
Customer: name + code chip
Order: ORD reference chip
Sarees: count + IDs list · DM Mono 11px burgundy · scrollable if many
Dispatch Date: DM Mono chip
LR Number: DM Mono chip
Admin-editable fields:
"Invoice Number *" — DM Mono input · 48px height · #FFF8E7 background · auto-suggested as "INV-2026-[SEQ]" · editable
"Invoice Date *" — date picker · default today
Per saree type pricing table:
Label: "Price Per Saree (₹) — by type" — DM Sans 600 13px dark
Table with columns: Saree Type · Count · Rate · Subtotal
Each rate row editable — pre-filled from superadmin rates · admin can override
Self Brocade (SB-001) · 3 sarees · ₹8,500 · ₹25,500
Heavy Zari (HZ-003) · 2 sarees · ₹12,000 · ₹24,000
"Total Amount:" — auto-calculated · DM Mono 700 20px gold · right · updates live
"Payment Due Date *" — date picker · auto-calculated from customer payment terms
Shows: "Based on 30-day terms: Due by 13 Jul 2026" — DM Sans 12px muted
"Firm Making This Invoice *" — dropdown · 6 firms · mandatory
Label: "Select which firm is raising this invoice"
"Notes (Optional)" — textarea · 2 rows

Right panel (45%) — Live Invoice Preview:
Section label: "Invoice Preview" — DM Sans 600 13px muted · centered
White preview card · border rgba(139,26,46,0.20) · 12px radius · padding 20px · scales down to fit panel
Invoice content (live preview — updates as left panel is filled):
Header:
Lotus mark 20px · "Beere Kesava & Brothers Silks" Playfair Display 700 16px burgundy · centered
"Est. 1999" DM Mono 10px gold · "GST: [firm GST if applicable]" DM Sans 10px muted
Invoice reference row:
"Invoice No: INV-2026-041" DM Mono 11px · "Date: 13 Jun 2026" DM Mono 11px · right aligned
Customer block:
"Bill To:" DM Sans 500 11px muted · Customer name DM Sans 600 13px · address · code
Items table:
Saree ID · Design · Type · Rate · Total
Each row DM Sans 11px · DM Mono for amounts
Grand total box:
Cream background · "Total: ₹49,500" Playfair Display 700 18px gold · right
Payment terms:
"Payment due by: 13 Jul 2026" DM Sans 11px muted
"Terms: 30 days from dispatch"
Footer:
"Beere Kesava & Brothers Silks · Est. 1999" · "Tradition · Trust · Timeless Quality"

Modal footer buttons:
"👁 Preview Full Size" — ghost burgundy · left
"📤 Send Invoice to Customer" — #1E6640 green filled · large · 52px · right · sends via WhatsApp + email
"💾 Save Draft Invoice" — ghost muted · below Send button
After sending:
Modal closes · Green success strip on Payments page:
"✓ Invoice INV-2026-041 sent to Lakshmi Silks via WhatsApp and email. Payment tracking started." — DM Sans 500 13px green · full width

ADDITION 3 — LOW STOCK NOTIFICATION FROM SHOP
Add to: Overview page — in the existing Recent Activity feed section
When shop staff taps "Report Low Stock to Admin" from their portal — it appears as a new activity item in the Admin Overview Recent Activity feed:
Activity item style — urgent:
Crimson dot 8px · left
"🏪 Shop Staff reported low stock — only 12 sarees remaining in shop. Review and arrange restocking." — DM Sans 500 13px dark
"Just now" — DM Mono 10px muted · right
Also add to: Admin portal notification bell dropdown
When bell icon is clicked — dropdown shows:
Notification item with crimson background tint:
🔴 "Low Stock Alert from Shop Staff"
"Shop inventory: 12 sarees remaining · Below threshold"
"Take Action →" — gold link right
Timestamp: DM Mono 10px muted

Also add on Customers page — Wholesale section:
When wholesale customer's outstanding payment exceeds 45 days — add an alert chip to that customer's card:
"⚠ Payment Alert — Day 47" — crimson chip · DM Mono 10px
Consistent with the confirmed Day 45 alert rule.

ADDITION 4 — DUAL ASSIGNMENT SOURCE ON PRODUCTION PAGE
Add to: Production page — "Sarees in Stock — Quality Check Passed" section
Find: Every saree card in this section that has been assigned to finishing
Add assignment source tag to each assigned saree:
If assigned by Admin:
"✂ Assigned to Finishing by Admin (BK)" — DM Sans 500 12px muted · pencil icon left
If assigned by Shop Staff:
"✂ Assigned to Finishing by Shop Staff (SS)" — DM Sans 500 12px muted · shop icon left
Both show: "Assigned: Today · 11:42 AM" — DM Mono 10px muted
For sarees NOT yet assigned:
Status stays: "✓ In Stock — Available for Sale" green badge
No assignment tag shown — unchanged

WHAT NOT TO CHANGE
All existing sections on all Admin portal pages — unchanged
Existing Payments page sections (Financial Summary, Weaver Payments, Customer Collections, Vendor Payments, Analytics, Payment History) — all unchanged
Overview page Recent Activity section — only ADD the shop alert item to the existing feed
Production page — only ADD the assignment source tag to assigned saree cards
All colors, typography, card styles, navigation — unchanged
