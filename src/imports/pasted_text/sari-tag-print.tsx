You are updating the BKB Silks ERP Admin Portal in Figma Make.

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
- Full words only, no abbreviations — users have low digital literacy

---

CHANGE 1 — SARI TAG PRINT SYSTEM

Add a "Print Tag" button on every individual Sari record detail page.

Button placement: Top right of the sari detail page header, next to the existing action buttons.
Button label: 🖨 Print Tag
Button style: Outlined, Burgundy border, Burgundy text, Gold icon.

When "Print Tag" is clicked, open a full-screen modal called "Tag Preview".

TAG PREVIEW MODAL:
- Modal title: "Sari Tag Preview" in Playfair Display
- Left side (60% width): Live preview of the physical label — sized 100mm × 50mm, white background, thin burgundy border
- Right side (40% width): Print settings panel

LABEL PREVIEW (inside the 100mm × 50mm box):
- Top left: BKB Silks logo text in Playfair Display, small, Burgundy
- Center: Large Code 128 barcode — black bars, generated from the unique sari code
- Below barcode: Unique Sari Code in DM Mono, bold, 14px (example: BSK-2024-00123)
- Below code: Two columns of details in DM Sans 11px
  - Left column: "Weaver" label in gold, weaver name in black below it
  - Right column: "Dispatch Date" label in gold, date in black below it
- Bottom right corner: Small "BKB Silks" text in burgundy, 9px

PRINT SETTINGS PANEL (right side):
- Heading: "Print Settings" in DM Sans Medium
- Printer field: Dropdown showing "TSC TE244" as default option — label reads "Printer"
- Label Size: Dropdown showing "100mm × 50mm" as default — label reads "Label Size"
- Copies: Number input defaulting to 1 — label reads "Number of Copies"
- Checkboxes (all checked by default):
  - "Show Weaver Name"
  - "Show Dispatch Date"
  - "Show BKB Silks Branding"
- Two buttons at bottom:
  - "Print Now" — filled Burgundy button, full width
  - "Cancel" — text button, below Print Now

---

BULK PRINT on Sari List Page:

On the main Sari inventory list/table:
- Add a checkbox column as the first column of the table
- Add a sticky action bar that appears at the bottom of the screen when 1 or more checkboxes are selected
- Sticky bar content: "{N} Sarees Selected" in DM Sans + "Print Selected Tags" button (Burgundy filled) + "Clear Selection" text button
- The sticky bar uses white background, top border in #E8DDD5, subtle drop shadow upward

---

CHANGE 2 — RETAIL INVENTORY: EXTERNAL PURCHASE ENTRY

Add a new button on the Retail Inventory page header:
Button label: + Add External Purchase
Button style: Filled Burgundy button with plus icon

Clicking this opens a right-side drawer panel (not a modal) titled "Add External Purchase" in Playfair Display.

DRAWER FORM FIELDS (in this order, each with a label above the input):

1. Supplier Short Name — Text input — placeholder: "e.g. Ravi Silks"
2. Serial Number — Text input in DM Mono — placeholder: "e.g. EXT-2024-0045"
3. Source / Industry Type — Dropdown with options: Wholesale Supplier, Local Weaver, Auction Purchase, Sister Store Transfer, Other
4. Supplier Location — Text input — placeholder: "City, State"
5. Purchase Date — Date picker — default today's date
6. Number of Sarees — Number input — minimum 1
7. Price Per Saree (₹) — Number input in DM Mono — placeholder: "0.00"
8. Total Amount (₹) — Auto-calculated, read-only field in DM Mono, light grey background — label: "Total Amount (auto)"
9. Payment Status — Radio buttons: Paid / Pending / Partial
10. Invoice / Reference Number — Text input — placeholder: "Optional"
11. Notes — Textarea, 3 rows — placeholder: "Any additional details about this purchase"

DRAWER FOOTER (sticky at bottom of drawer):
- "Save Purchase" — Filled Burgundy button
- "Cancel" — Text button

After saving, show a success toast at top right: "External purchase recorded successfully" with a green checkmark icon.

---

EXTERNAL PURCHASES TABLE (below existing inventory table or as a separate tab):

Add a tab switcher on the Retail Inventory page:
- Tab 1: "Stock Inventory" (existing content)
- Tab 2: "External Purchases"

External Purchases tab shows a table with columns:
Serial Number | Supplier Name | Source Type | Purchase Date | Sarees | Price/Saree | Total | Payment Status | Actions

- Serial Number: DM Mono, bold
- Payment Status: Pill badge — Green for Paid, Orange for Pending, Red for Partial
- Actions column: "View" icon button + "Edit" icon button

---

MOBILE SCAN VIEW PAGE (new screen — public facing):

Design a standalone mobile screen (375px wide) that appears when a barcode is scanned.

Page background: White
Top bar: Burgundy #6B1A2A, height 56px, center-aligned "BKB Silks" in Playfair Display white text

CONTENT (scrollable, padding 20px):
1. Sari photo — full width, 200px height, rounded 8px, object-fit cover — placeholder shows a silk texture pattern
2. Unique Sari Code — DM Mono Bold 18px, Burgundy color, centered, with a small copy icon beside it
3. Status pill — centered below code — "Dispatched" in green pill
4. Divider line
5. Details card — white card with #E8DDD5 border, 12px padding, rounded 8px
   Rows in this card (label in gold DM Sans 12px, value in black DM Sans 14px, separated by thin divider lines):
   - Weaver Name
   - Fabric Type
   - Colour
   - Jari Type
   - Dispatch Date
   - Production Stage Completed
6. Bottom area: BKB Silks logo + tagline "Authentic Handcrafted Silk Sarees" in small grey text

No login. No prices. No supplier info. Read-only.