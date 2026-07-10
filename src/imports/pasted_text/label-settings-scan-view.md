You are updating the BKB Silks ERP Superadmin Portal in Figma Make.

DESIGN SYSTEM (do not deviate):
- Primary: Burgundy #6B1A2A
- Accent: Gold #C4923A
- Background: White #FFFFFF
- Surface: #F9F5F0
- Border: #E8DDD5
- Text Primary: #1A1A1A
- Text Secondary: #6B6B6B
- Headings: Playfair Display
- UI Text: DM Sans
- Codes/Numbers: DM Mono
- Corner radius: 8px
- Icon + text on all buttons (never icon-only)
- Full words only, no abbreviations

---

CHANGE 1 — LABEL TEMPLATE SETTINGS PAGE

Add a new item in the Superadmin sidebar navigation under the "Settings" section:
- Icon: printer icon
- Label: Label Settings

This opens a new page titled "Sari Tag Label Settings" in Playfair Display as the page heading.

PAGE LAYOUT:
Two columns — Left (55%): Live label preview. Right (45%): Settings controls.

LEFT COLUMN — LIVE PREVIEW:
- Section heading: "Live Preview" in DM Sans Medium, gold color
- Preview box showing the label exactly as it will print
- Label dimensions: 100mm × 50mm, white background, thin burgundy border, drop shadow
- Updates live as settings are changed on the right
- Below preview box: small text in grey — "Actual print size: 100mm × 50mm on TSC TE244"
- A "Print Test Label" button below — outlined Burgundy, with 🖨 icon — label: "🖨 Print Test Label"

RIGHT COLUMN — SETTINGS CONTROLS:

SECTION 1: "Label Size" (card with #F9F5F0 background, 16px padding)
- Label: "Label Dimensions"
- Dropdown with options: 100mm × 50mm (Default), 80mm × 40mm, 60mm × 40mm
- Note text below in grey 12px: "Match this to the roll currently loaded in TSC TE244"

SECTION 2: "Fields to Show on Label" (card)
- Section heading: "Visible Fields"
- Toggle switches (ON by default) for each field:
  - Barcode
  - Unique Sari Code
  - Weaver Name
  - Dispatch Date
  - BKB Silks Branding / Logo
- Each toggle has field name on left and ON/OFF switch on right
- Warning banner (gold background, dark text) if Barcode is turned OFF: "⚠ Turning off the barcode will prevent scanning. Are you sure?"

SECTION 3: "Barcode Settings" (card)
- Barcode Format: Read-only field showing "Code 128" with a lock icon — label: "Barcode Format (fixed)"
- Barcode Content: Read-only field showing "URL: bkbsilks.com/sari/{sari_code}" — label: "Encoded Value"
- Small info text: "Each barcode links to the public sari detail page when scanned"

SECTION 4: "Printer Configuration" (card)
- Default Printer: Dropdown showing "TSC TE244" — label: "Default Printer"
- Connection Type: Dropdown — USB / Network (Ethernet) — label: "Connection Type"
- Test button: "🖨 Send Test Print" — outlined Burgundy button
- Status indicator next to button: Green dot + "Printer Ready" or Red dot + "Not Connected"

PAGE FOOTER (sticky):
- "Save Settings" — Filled Burgundy button
- "Reset to Default" — Text button in grey
- Last saved timestamp in small grey text: "Last saved: Today at 2:34 PM"

---

CHANGE 2 — EXTERNAL PURCHASE OVERSIGHT

Add a new item in the Superadmin sidebar under "Inventory":
- Icon: shopping bag icon
- Label: External Purchases

This opens a new page titled "External Purchases — All Branches" in Playfair Display.

PAGE HEADER:
- Page title left-aligned
- Right side: Date range filter (From — To date pickers) + "Export to Excel" outlined button + "Add External Purchase" Burgundy filled button

SUMMARY CARDS ROW (4 cards, equal width):
1. Total External Purchases — big number in DM Mono, label below in DM Sans, burgundy icon
2. Total Amount Spent (₹) — big number in DM Mono with ₹ prefix
3. Pending Payments — number in orange DM Mono
4. This Month's Purchases — number in DM Mono

FILTER BAR (below summary cards):
- Search input: "Search by supplier name or serial number"
- Source Type filter: Dropdown — All / Wholesale Supplier / Local Weaver / Auction Purchase / Sister Store Transfer / Other
- Payment Status filter: Dropdown — All / Paid / Pending / Partial
- Clear Filters: text button

MAIN TABLE:
Columns: Serial Number | Supplier Name | Source Type | Location | Purchase Date | Sarees | Total Amount | Payment Status | Added By | Actions

- Serial Number: DM Mono bold, burgundy color
- Total Amount: DM Mono with ₹ prefix
- Payment Status: Pill badge — Green/Paid, Orange/Pending, Red/Partial
- Added By: shows which Admin logged this entry
- Actions: "View Details" icon button + "Edit" icon button + "Delete" icon button (delete in red)

TABLE PAGINATION: Show 20 rows per page, pagination controls at bottom right.

ROW CLICK → DETAIL DRAWER:
Clicking any row opens a right-side detail drawer showing all fields of that purchase entry in read-only format. Drawer title: "Purchase Details" in Playfair Display. Footer has "Edit Entry" Burgundy button and "Close" text button.

---

SUPERADMIN — SCAN VIEW CONTROL (inside Label Settings page):

Add a fifth section at the bottom of the Label Settings page:

SECTION 5: "Public Scan Page Settings" (card)
- Section heading: "What Customers See When They Scan"
- Toggle switches for fields shown on the public mobile scan page:
  - Sari Photo — ON
  - Unique Sari Code — ON
  - Weaver Name — ON (with note: "Turning this off hides weaver identity from public")
  - Fabric Type — ON
  - Colour — ON
  - Jari Type — ON
  - Dispatch Date — ON
  - Production Status — ON
- Fields that are permanently hidden (shown as read-only locked toggles, OFF, greyed out):
  - Cost Price — 🔒 Always hidden
  - Supplier Details — 🔒 Always hidden
  - Profit Margin — 🔒 Always hidden
- Preview link at bottom: "Preview Public Scan Page →" — gold text link, opens the mobile scan view in a new frame