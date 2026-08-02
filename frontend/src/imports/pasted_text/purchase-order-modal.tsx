Purchase Order Creation Flow — Admin Portal + Superadmin Portal
Beere Kesava & Brothers Silks ERP · Est. 1999

You are adding a complete Purchase Order creation and approval flow to the existing Admin Portal and Superadmin Portal of the Beere Kesava & Brothers Silks ERP. This flow spans both portals. Match all existing design patterns, card styles, button styles, modal styles, section header patterns, and color system exactly as already built across both portals. Do not introduce any new design elements. Attach all existing Admin and Superadmin portal screenshots as reference.

PART 1 — ADMIN PORTAL: MATERIALS PAGE
Step 1 — Create Purchase Order Button
On the existing Materials page — Stock Alerts section, the "Create Purchase Order" button already exists on each alert card but currently does nothing.
Make this button open a full Create Purchase Order modal (see Step 2 below).
Also add a new "➕ Create Purchase Order" button in the Materials page section header row — right side — same style as other primary action buttons already on the page. This button should also open the same Create Purchase Order modal.

Step 2 — Create Purchase Order Modal
Modal design: Follow the exact same modal style already used in the Invoice Generator modal on the Payments page — same shadow, same border radius, same dark header strip, same two-panel layout, same footer buttons.
Modal width: 860px max. Centered. Dark overlay behind. Close × button top right.
Modal header strip — dark burgundy:

Title: "Create Purchase Order" — Playfair Display 700 22px white

Sub: "New material request to vendor — requires Superadmin approval" — DM Mono 11px gold below

TWO PANEL LAYOUT — same as Invoice Generator:
Left Panel (55%) — PO Form:
Section: Vendor Details
Field 1 — Vendor Name (required):

Dropdown input showing existing vendors already in the system:

Sri Venkateswara Textiles · Ongole, AP
Lakshmi Thread House · Chennai, TN
Kanchipuram Silks · Kanchipuram, TN
Mysore Silk Co. · Mysore, KA
Surat Zari Works · Surat, GJ
Varanasi Zari House · Varanasi, UP

Option at bottom: "+ Add New Vendor" — gold link — opens a small inline form with: Vendor Name, City, State, Phone, Material Type supplied

After vendor selected — auto-fills a read-only info row:

Vendor name · city · material type they supply — shown as chips
Field 2 — Vendor Contact Name (optional):

Text input
Field 3 — Expected Delivery Date (required):

Date picker — minimum date: today + 3 days

Section: Materials to Order
Label: "What materials are you ordering from this vendor?"
Dynamic material rows — starts with one row, can add more:
Each material row is a horizontal card with these fields side by side:

Material Type dropdown: Warp / Resham / Jari
Sub-type (appears based on selection):

If Warp: text field "Cotton/Silk"
If Resham: Color dropdown (Red/Gold/Green/Blue/Maroon/Cream/Other)
If Jari: Type (Polyester/Silk Fast) + Grade (1G/2G/3G/4G/5G) + Color (Gold/Silver/Copper/Pink/Blue/Green)


Quantity input:

If Warp or Resham: number input + "kg" suffix
If Jari: number input + unit toggle "Reels / Buns" + auto-conversion shown below


Estimated Price Per Unit: number input with ₹ prefix
Subtotal: auto-calculated read-only — shows quantity × price per unit

"➕ Add Another Material" button below the rows — adds a new empty material row
Remove button (×) on each row — removes that row

Section: Order Summary
Calculated automatically from all material rows:
"Estimated Total Value:" — Playfair Display 700 20px gold — auto-sums all subtotals
"Number of Material Types:" — DM Mono 12px muted — count of rows

Section: Additional Details

PO Number: DM Mono input — auto-suggested as "PO-2026-[next number]" — editable
Notes for Vendor (optional): textarea — "Any special instructions for this order"
Notes for Superadmin (optional): textarea — "Why is this order needed"
Urgency: Radio buttons — "Normal" / "Urgent — Low Stock"


Left Panel Footer Buttons:
"📋 Submit for Superadmin Approval" — burgundy filled · full width · 52px height · icon + text

"💾 Save as Draft" — ghost burgundy · full width · 48px height

"× Cancel" — ghost muted · full width · 44px height

Right Panel (45%) — Live PO Document Preview:
Label: "PO Document Preview" — DM Sans 600 13px muted centered
White preview card — same style as Invoice preview in Invoice Generator — updates live as left panel is filled:
PO Document layout inside preview:
Header block — burgundy background strip:

Lotus mark + "Beere Kesava & Brothers Silks" Playfair Display 700 16px white centered

"Est. 1999" DM Mono 10px gold centered

Firm address below in DM Sans 11px rgba white 70%
Reference row:

"Purchase Order No: PO-2026-023" DM Mono 12px burgundy · left

"Date: [today's date]" DM Mono 11px muted · right
Vendor block:

"Vendor:" DM Sans 500 11px muted

Vendor name DM Sans 600 13px dark

Vendor city · contact name below
Delivery block:

"Expected Delivery:" DM Sans 500 11px muted · date value DM Mono 12px
Materials table:

Column headers: Material · Description · Quantity · Unit Price · Total

Each material row: DM Sans 12px · DM Mono for amounts and quantities

Total row: cream background · "Estimated Total: ₹X" Playfair Display 700 16px gold right
Notes block (if filled):

"Instructions:" DM Sans 500 11px muted · notes text DM Sans 12px
Signature block:

Two signature lines side by side:

Left: "Prepared by: _____________" · "Admin" DM Sans 11px muted below

Right: "Approved by: _____________" · "Superadmin" DM Sans 11px muted below
Footer:

"Beere Kesava & Brothers Silks · Est. 1999" DM Sans 10px muted centered

"Tradition · Trust · Timeless Quality" DM Mono 9px gold centered

Step 3 — After Submission (Admin Side)
When Admin clicks "Submit for Superadmin Approval":
Modal closes.
Success strip appears on the Materials page — same green success strip pattern used elsewhere:

"✓ Purchase Order PO-2026-023 submitted for Superadmin approval. You will be notified when it is approved or rejected."
New section appears on Materials page — "Purchase Orders — Pending Approval":
Section title: burgundy bar + "Purchase Orders — Pending Approval" + "View All POs →" gold right link
Shows a compact card for the newly created PO and all other pending POs:
Each pending PO card — white card · gold left border 4px:

PO number DM Mono 14px burgundy · Vendor name · Materials summary · Estimated value gold · "⏳ Awaiting Superadmin Approval" gold badge · Date submitted DM Mono 10px muted
Also show approved POs with green left border:

"✓ Approved — Ready to Receive" green badge · "📦 Receive Against This PO" green filled button
Also show rejected POs with crimson left border:

"✗ Rejected" crimson badge · reason if given · "📋 Create New PO" ghost button

Step 4 — GRN Page Update (Admin Portal — Receive Stock)
The Receive Stock / GRN flow must now be linked to approved POs.
On the GRN page in the Admin portal — Step 1 "Select Purchase Order" dropdown:
Update this dropdown to show only Approved POs from the POs created in Step 2:
Each dropdown option shows: PO number · Vendor name · Materials summary · Approved date
After selecting a PO — auto-fills:

Vendor name (read only)
Materials expected with quantities (read only — from the PO)
Expected delivery date (read only)

Worker then enters actual quantities received (which may differ from PO quantities — shortfall/excess detected automatically).

PART 2 — SUPERADMIN PORTAL: APPROVALS PAGE
Step 5 — PO Appears in Approvals Page
When Admin submits a PO — it must appear as a new card in the Superadmin Approvals page → Purchase Orders tab.
The existing Purchase Orders tab already has 3 static PO cards (PO-2026-020, 021, 022). The new Admin-created PO appears at the top of this list — same card design.
Update the PO card design to include these additional elements not currently on the existing cards:
Add below the existing materials list on each card:
Estimated Total Value row:

"Estimated Total:" DM Sans 500 13px muted · "₹1,40,000" Playfair Display 600 18px gold right
Notes from Admin row (if provided):

"Admin's note:" DM Sans 500 12px muted · note text DM Sans 12px muted italic
Urgency indicator (if marked Urgent):

"🔴 Urgent — Low Stock Alert" crimson chip · DM Mono 10px
Add "📄 View PO Document" button below the existing Approve/Reject buttons:

Ghost burgundy button · full width · 44px height · icon + text

When clicked — opens the PO Document Preview in a modal (same document design as the right panel preview in Step 2 above — but now read-only, with "Approved by" signature line filled with "Superadmin" and today's date)

Step 6 — Approve Flow Update
When Superadmin clicks "✓ Approve — Send PO to Vendor":
Existing approve behavior stays — card removed from pending list, moves to history.
Add these new behaviors:

Success toast: "PO-2026-023 approved. Admin has been notified. PO document ready for download."
PO Document becomes downloadable — after approval, the PO Document modal (opened via "View PO Document" button) shows:

All details filled
"Approved by: Superadmin · [date]" in signature line
Two action buttons at bottom of the document modal:

"🖨 Print PO Document" — triggers window.print()
"📤 Share PO Document" — shows toast: "PO document ready — share with vendor via WhatsApp or email"




Admin portal Materials page — the pending PO card status changes from "⏳ Awaiting Approval" to "✓ Approved — Ready to Receive"


Step 7 — Reject Flow Update
When Superadmin clicks "✗ Reject":
Existing reject behavior stays — no reason required, card removed.
Add:

Success toast: "PO-2026-023 rejected. Admin has been notified."
Admin portal Materials page — pending PO card status changes to "✗ Rejected" crimson badge.

PART 3 — PO DOCUMENT MODAL (Standalone)
This modal is triggered from both Admin portal (after approval) and Superadmin portal (View PO Document button). It is a read-only full document view.
Modal design: Same style as Invoice Generator modal — 860px max · dark header · close × · dark overlay.
Modal header:

"Purchase Order Document" — Playfair Display 700 22px white

"PO-2026-023 · Approved" — DM Mono 12px gold
Full PO document — same layout as right panel preview in Step 2 but full size:

All same sections — header, vendor, materials table, totals, notes, signature block, footer.
After approval — signature block shows:

"Approved by: Superadmin · [approval date]" — pre-filled
Modal footer buttons:

"🖨 Print PO Document" — burgundy filled · 52px — triggers window.print()

"📤 Share with Vendor" — green filled · 52px — shows toast: "PO document ready to share with vendor via WhatsApp or email"

"💾 Download as PDF" — ghost burgundy · 48px — triggers window.print()

"× Close" — ghost muted · 44px

PART 4 — PURCHASE ORDER TRACKER SECTION
Add a new "Purchase Orders" section to the Admin portal Materials page — placed between the Stock Alerts section and the Current Stock Overview section.
This section shows all POs in one place — all statuses together with filter pills.
Section title: burgundy bar + "Purchase Orders" + "➕ Create New PO →" gold right link
Filter pills:

"All POs" (active) · "Pending Approval (X)" · "Approved (X)" · "Received (X)" · "Rejected (X)"
PO cards — same compact card design as described in Step 3 above:
Show 4 cards as sample data:
Card 1 — PO-2026-023: ⏳ Pending Approval · Sri Venkateswara Textiles · Warp 50kg · ₹1,40,000 · Submitted today

Card 2 — PO-2026-022: ✓ Approved · Sri Venkateswara Textiles · Warp 50kg · ₹1,40,000 · Approved yesterday · "📦 Receive Against This PO" button

Card 3 — PO-2026-021: ✓ Approved · Kanchipuram Silks · Resham Red 30kg + Gold 25kg · ₹3,75,000 · "📦 Receive Against This PO" button

Card 4 — PO-2026-020: ✓ Received · Surat Zari Works · Jari PLY-2G-Gold 6 Buns · ₹1,92,000 · "GRN-2026-031 Created ✓" chip

IMPORTANT INSTRUCTIONS

Do not change any existing design on any page. Use exact existing card styles, modal styles, button styles, form styles, toast patterns, dropdown styles already present in both portals.
The PO Document uses window.print() for PDF generation — no external library needed.
For the "Share with Vendor" action — show a toast only. Actual sending is a backend task.
For cross-portal PO status updates — when Admin submits a PO and Superadmin approves it, update the card status on both sides using local state for now.
The Create PO modal and PO Document modal follow the exact same two-panel layout already established by the Invoice Generator modal in the Payments page.
All form validation: show inline error messages below required fields if empty when Submit is clicked. Same validation style already used in existing forms.
The PO number auto-increments — if PO-2026-022 exists, next is PO-2026-023.