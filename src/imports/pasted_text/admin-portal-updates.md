FIX PROMPT 2
Admin Portal — 4 Additions
Beere Kesava & Brothers Silks ERP · Est. 1999

You are adding 4 new features to the existing Admin Portal of the Beere Kesava & Brothers Silks ERP (Est. 1999). Attach all existing Admin portal screenshots as reference. Preserve all existing design language exactly.

DESIGN SYSTEM — Same as Admin Portal
Background: #FFFFFF · Burgundy: #6B1A2A · Dark: #3D0E1A · Gold: #C4923A · Green: #1E6640 · Crimson: #C0392B · Muted: #8B7060 · Cream: #F0E8D0
Fonts: Playfair Display · DM Sans · DM Mono
Cards: white · 1px solid rgba(139,26,46,0.12) · 14–16px radius · soft shadow
Section title: burgundy vertical bar + DM Sans 600 + gold right link
Buttons: always icon + text · Icons: same dashboard icon set

ADDITION 1 — DEFECTIVE SAREES VIEW SECTION
Add to: Production page — new section below "Sarees in Stock — Quality Check Passed"
Section title: burgundy bar + "Defective Sarees — Failed Quality Check" + "Download Defective Report →" gold right link
Sub-label: "These sarees failed quality check by worker staff. They are stored separately. View only — no action can be taken from this page." — DM Sans 13px muted
Read-only notice strip:
rgba(192,57,43,0.06) crimson background · crimson border · 10px radius · padding 10px 18px
"🔒 This is a view-only section. Defective sarees are managed by the system automatically. Deductions have already been applied to the relevant weavers." — DM Sans 12px muted
Filter bar:
Filter pills: "All Time" (active) · "This Month" · "This Week" · "Today"
Filter by: Weaver dropdown · Defect type dropdown · Design code search
Defective Sarees Table:
White card · 16px radius · shadow
Column headers DM Mono 9px uppercase muted:
Saree ID · Weaver · Batch · Design Code · Saree Type · Defect Type(s) · QC Date · Deduction Applied · Action
Row styling:
Saree ID: DM Mono 12px burgundy
Weaver: DM Sans 600 13px dark
Defect Type: crimson pill badges
Deduction Applied: DM Mono 13px crimson
Action: "👁 View" ghost button only — no edit, no delete
5 sample rows:
PADMA-L1-004 · Padma Veni · BATCH-086 · BKB-045 · Self Brocade · Thread Break · 11 Jun 2026 · ₹450
RAVI-L2-008 · Ravi Kumar · BATCH-089 · BKB-031 · Heavy Zari · Design Error · 10 Jun 2026 · ₹680
BKB-L3-002 · Own Factory L3 · BATCH-OWN · BKB-022 · Plain Silk · Weight Problem · 10 Jun 2026 · ₹280
SURESH-L2-003 · Suresh Murti · BATCH-081 · BKB-038 · Self Brocade · Jari Issue · 09 Jun 2026 · ₹450
PADMA-L1-003 · Padma Veni · BATCH-086 · BKB-045 · Self Brocade · Thread Break · 09 Jun 2026 · ₹450
Summary footer row:
Cream background: "Total defective this month: 10 sarees · Total deductions applied: ₹4,510" · DM Sans 600 13px

ADDITION 2 — ASSIGN TO FINISHING — Updated Flow
Update on: Production page — "Sarees in Stock — Quality Check Passed" section
Replace existing "Assign to Finishing" button with the updated flow:
Each saree card in this section now shows TWO assignment options:
For Retail: Saree has no linked sale yet

Status: "✓ In Stock — Available for Sale" green badge
No assign button — finishing assignment happens after retail sale is recorded
Note: "Will be assigned to finishing after retail sale" DM Sans 11px muted

For Sarees with confirmed retail sale:

Status: "🛍 Sold — Assign to Finishing" gold badge
"✂ Assign to Finishing Staff" — green filled button · icon + text
Clicking opens: simple confirmation modal
Title: "Assign to Finishing" Playfair 600 18px
Shows: Saree ID · Design · Sale reference · Retail customer
Button: "✓ Confirm Assignment" green filled · "× Cancel" ghost

For Wholesale batches:

Status: "📦 Wholesale Batch — Assign to Finishing" gold badge
"✂ Assign Batch to Finishing Staff" — green filled button
Clicking opens: batch assignment modal
Title: "Assign Wholesale Batch to Finishing"
Shows: Batch ID · Customer · Order number · Saree count
Note: "All sarees in this batch will be assigned together"
Button: "✓ Confirm Batch Assignment" green filled

After assignment: saree/batch moves to "Assigned for Finishing" status · Finishing Staff notified

ADDITION 3 — DISPATCH DRAFT INBOX
Add to: Payments page — new section above Payment History
OR add as a new notification panel accessible from the top navigation bell icon — whichever fits better in the existing layout. Choose the better placement.
Section title: burgundy bar + "Dispatch Drafts — From Finishing Staff" + "View All →" gold right link
Sub-label: "Finishing staff has submitted these dispatch drafts. Review each one, add any required information, and confirm to finalise the dispatch." — DM Sans 13px muted
Alert strip if drafts pending:
Gold background strip: "⚠ X dispatch drafts are waiting for your review and confirmation." — DM Sans 500 13px gold
Draft cards — 2 types:
Shop Dispatch Draft card:
White card · 14px radius · border · shadow sm · green left border 4px
Top: "🏪 Shop Dispatch Draft" — DM Sans 600 14px dark · "Submitted by Finishing Staff" DM Mono 10px muted right
Content:

Sarees: count + saree IDs list DM Mono 11px burgundy
LR Number: DM Mono 12px
Transport: company + vehicle
Date: dispatch date
"Submitted: X hours ago" DM Mono 10px muted

Two buttons:
"✓ Confirm Shop Dispatch" — green filled · stock moves factory to shop
"✏ Edit Before Confirming" — ghost burgundy
Wholesale Dispatch Draft card:
White card · gold left border 4px
Top: "🚚 Wholesale Dispatch Draft" · customer name + order reference
Content:

Customer: name + code
Order: ORD reference · saree count
Saree IDs list
LR Number + Transport details
"📋 Invoice not yet generated" — gold chip

Three buttons:
"📄 Generate Invoice" — burgundy filled — opens invoice generator
"✓ Confirm After Invoice" — green filled — only active after invoice generated
"✏ Edit Draft" — ghost

ADDITION 4 — INVOICE GENERATOR
Add to: Payments page — opens as a full page modal when "Generate Invoice" is clicked from a wholesale dispatch draft
Invoice Generator Modal:
White background · 24px radius · shadow large · max-width 860px · centered · dark overlay
Modal header:
Dark burgundy strip · "Generate Wholesale Invoice" Playfair Display 700 22px white · close × button
Two-panel layout:
Left panel (55%) — Invoice Form:
Auto-filled fields (from dispatch draft — read only):

Customer name + code
Order reference ORD number
Sarees: count + IDs
Dispatch date
LR number + transport details

Admin-editable fields:

"Invoice Number" — DM Mono input · auto-suggested · editable
"Invoice Date" — date picker · default today
"Price Per Saree (₹)" — number input per saree type · pre-filled from superadmin rates · editable
"Total Amount (₹)" — auto-calculated · DM Mono large · read only
"Payment Due Date" — date picker · calculated from customer payment terms
"GST (if applicable)" — number input + percentage toggle
"Additional Notes" — textarea · "Any special terms or notes for this customer"

Firm selector:
"Pay From Firm" — dropdown · 6 firms · mandatory
Label: "Which firm is raising this invoice?"
Right panel (45%) — Live Invoice Preview:
Shows real-time preview of the invoice as fields are filled
Invoice header: "Beere Kesava & Brothers Silks · Est. 1999"
Customer details block
Item table: Saree IDs · Design · Type · Price · Total
Grand total box
Terms and conditions area
Firm stamp area
Modal footer buttons:
"👁 Preview Full Invoice" — ghost burgundy
"📤 Send Invoice to Customer" — green filled · large · sends via WhatsApp + email · customer notified
"💾 Save as Draft" — ghost
"× Cancel" — ghost muted
After sending:
Success: "Invoice sent to [Customer Name] via WhatsApp and email. Payment tracking has started." — DM Sans 13px green
Payment tracking record created automatically in Payments page.