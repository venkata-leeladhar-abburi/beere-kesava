CUSTOMERS PAGE FIX PROMPT
You are making targeted corrections to the Superadmin Portal — Customers Page of the Beere Keshava & Brothers Silks ERP (Est. 1999). Attach the current Customers page screenshot as reference. Apply only the fixes listed below. Do not change anything else.
Design System:
Burgundy: #6B1A2A · Gold: #C4923A · Green: #1E6640 · Crimson: #C0392B · Background: #FFFFFF · Dark: #3D0E1A · Muted: #8B7060 · Cards: white · subtle border · 14–16px radius · soft shadow · Fonts: Playfair Display · DM Sans · DM Mono · Buttons: always icon + text

FIX 1 — Wholesale Customer Card Buttons — Proper Styling
On every wholesale customer card — the three action links at the bottom currently appear as plain text. Redesign them as proper ghost buttons:
Three buttons side by side · equal width · full card width combined:

"👁 View" — ghost · burgundy border 1px · burgundy text · 10px radius · padding 7px 12px · DM Sans 500 12px
"✏ Edit" — ghost · same style
"📊 Report" — ghost · same style

Apply to all 8 visible wholesale customer cards.

FIX 2 — Wholesale Customer Modal Design
Design the Wholesale Customer Modal as a separate state shown below the wholesale customers section on the page. This modal appears when admin clicks "👁 View" on any customer card.
Modal specs:
White background · 24px border radius · shadow large 0 20px 60px rgba(44,24,16,0.20) · max-width 780px · centered on screen · dark overlay behind · close × button top right
Modal header strip — dark burgundy #3D0E1A:

Customer initial circle 56px gold background · white initials
Customer name: Playfair Display 700 22px white
"Wholesale Customer" badge: gold pill
Customer code: DM Mono 11px rgba white 55%

5 tabs inside modal:
"Overview" (active) · "Order History" · "Payment History" · "Contact Details" · "Edit Profile"
Tab style: active tab burgundy underline 2px · DM Sans 500 13px
Overview Tab Content:
Left column 55%:
Four stat cards in 2×2 grid — white background · subtle border · padding 14px:

"Total Orders Ever" / number — Playfair 700 24px dark
"Total Spend" / amount — Playfair 700 24px gold
"Outstanding Balance" / amount — Playfair 700 20px — green if zero · crimson if any
"Payment Terms" / "30 days" — DM Mono 600 18px

Current active order card — dark #3D0E1A background · padding 16px · 12px radius:

Order number DM Mono 12px gold
Sarees ordered · Design code · Deadline
Progress bar — gold fill

Last 3 invoices — compact rows:
Invoice No. · Amount · Status badge · Due date
Right column 45%:
Contact card — white · border · padding 18px:

👤 Owner: name — DM Sans 600 14px
📱 Phone: number
💬 WhatsApp: number
📍 Address: full address DM Sans 13px muted
🏙 City & State
💳 Payment Terms chip
🏦 Bank details (masked)
📝 Notes if any
"🔒 Superadmin only" label — DM Mono 9px muted — below bank details

Order History Tab:
Table — Order No. · Saree Type · Design · Qty Ordered · Qty Delivered · Order Date · Delivery Date · Status · Amount
Sample 5 rows with Completed · In Production · Partially Delivered statuses
Summary strip top: Total orders: 22 · Total sarees: 486 · Total value: ₹12,40,000
Payment History Tab:
Outstanding summary: "Currently Outstanding: ₹X" large crimson or green
Full payment table: Invoice No. · Invoice Date · Amount · Received · Outstanding · Due Date · Status · UTR
"📥 Record New Payment →" gold button top right
Contact Details Tab:
All fields displayed large and readable with pencil edit icon on each:
Business Name · Owner Name · Phone · WhatsApp · Address · City · State · Payment Terms · Bank Details · Notes
"Save Changes" button appears when any field edited
"🔒 Superadmin only" label beside Bank Details row
Edit Profile Tab:
Full edit form — all fields pre-filled and editable:
Business Name · Owner Name · Phone · WhatsApp · City · State · Address · Payment Terms dropdown · Bank Name · Account Number · IFSC · Notes
"✓ Save All Changes" — burgundy filled · "× Cancel" — ghost

FIX 3 — Retail Customer Modal Design
Design the Retail Customer Modal as a separate state shown below the retail customers section. Appears when admin clicks "View Purchase History".
Modal specs:
Same shadow and border radius as wholesale modal · max-width 680px
Modal header:
Customer avatar circle 52px · warm muted color · initials
Customer name: Playfair Display 700 20px dark
"Retail Customer" badge: DM Mono 9px gold pill
"Since [first purchase date]" — DM Sans 12px muted
2 tabs:
"Purchase History" (active) · "Profile Details"
Purchase History Tab:
Summary strip — 4 large readable numbers in a row:

"Total Purchases:" / number — Playfair 700 26px dark
"Total Spent:" / amount — Playfair 700 26px gold
"Average per Visit:" / amount — DM Sans 600 16px muted
"Total Returns:" / number — DM Sans 600 16px crimson

Purchase history table:
Sale Date · Saree ID (DM Mono burgundy) · Design · Saree Type · Price Paid · Return Made
Paginated · 10 per page
Returned rows: slightly muted with "Returned on [date]" crimson italic note
Profile Details Tab:
All auto-generated fields displayed:
Customer Name · Phone · Address (if collected) · City & State · First Purchase date · Last Purchase date · Customer Since (duration) · Loyalty Status badge
Note at bottom: "Retail customer profiles are created automatically at the shop when a sale is recorded." — DM Sans 12px muted italic

FIX 4 — Superadmin Only Labels
On wholesale customer cards — below the payment terms line — add:
"🔒 Bank details & special terms visible to Superadmin only" — DM Mono 9px #8B7060 muted
On the Inactive Customers table — add a "🔒 Superadmin only" chip next to the "Mark as Inactive" action button so it is clear only Superadmin can mark customers inactive.

DO NOT CHANGE:
Navigation · page header · stats strip · all Customer Analytics charts · wholesale customer card layout and content · retail customer card layout · inactive customers table content · footer