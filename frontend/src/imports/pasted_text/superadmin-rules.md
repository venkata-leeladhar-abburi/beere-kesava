Perfect. All answers are clear. Here is the complete Superadmin Rules Prompt — written to be efficient with Figma Make credits while being comprehensive.

---

## FIGMA MAKE PROMPT — STEP 1
### Superadmin Portal — Master Rules Prompt for All Shared Pages

---

You are designing the **Superadmin Portal** for the **Beere Keshava & Brothers Silks ERP** (Est. 1999). All 7 Admin dashboard page screenshots are attached as visual reference. The Superadmin portal shares the same 8 pages as the Admin portal — Overview, Materials, Weavers, Production, History, Payments, Reports, Customers — but with specific differences listed below. Apply these rules across all 8 shared pages. Do not redesign any page from scratch. Take each Admin page and apply only the changes described here. Preserve all existing design language exactly — colors, typography, card styles, photography, section patterns, spacing.

---

## DESIGN SYSTEM — Preserve Exactly

Background: `#FFFFFF`
Primary burgundy: `#6B1A2A`
Dark section: `#3D0E1A`
Gold: `#C4923A`
Text: `#1A0A0F`
Muted: `#8B7060`
Green: `#1E6640`
Crimson: `#C0392B`
Card: white, subtle border, 14–16px radius, soft shadow
Section title: burgundy vertical bar + DM Sans 600 + gold right link
Fonts: Playfair Display for numbers/headings · DM Sans for UI · DM Mono for codes
Buttons: always icon + text label

---

## RULE 1 — NAVIGATION

The Superadmin navigation has the same 8 main tabs as Admin:
**Overview · Materials · Weavers · Production · History · Payments · Reports · Customers**

Plus 3 exclusive pages accessed via a **"More ⋯" dropdown button** at the end of the navigation bar:

The "More ⋯" button:
- Position: far right of the navigation tabs, before the search/bell/avatar icons
- Style: DM Sans 500 13px · ghost pill button · "⋯ More" label · chevron down icon
- On click: dropdown menu appears with 3 items:
  - ⚙ "Rates & Pricing"
  - ✓ "Approvals"
  - 📋 "Audit Log"
- Dropdown: white background · 14px radius · shadow medium · each item 44px height · hover: cream background · DM Sans 500 13px

This keeps the navigation clean and uncluttered on all screen sizes.

---

## RULE 2 — SUPERADMIN IDENTITY

**Top right avatar — change from Admin to Superadmin:**

Replace the burgundy "BK · Admin" avatar with:
- Avatar circle: **gold `#C4923A` background** · white "SA" initials · Playfair Display 700 · same 36px size
- Text next to avatar: "Superadmin" — DM Sans 500 13px dark
- Dropdown chevron remains

This gold avatar is the primary visual signal that this is the Superadmin portal. Visible on every page — consistent across all 8 shared pages.

---

## RULE 3 — EDIT BUTTONS — Apply Across All Pages

In the Admin portal most data is view-only. In the Superadmin portal everything is editable. Apply this rule across all 8 pages:

**Wherever a "View" button or "View Details" button exists — add an "Edit" button alongside it:**
- "👁 View Details" button stays as is
- Add "✏ Edit" button immediately after — ghost button · burgundy border and text · same size as view button
- Both buttons sit side by side

**In data tables — Actions column:**
Every table row that currently shows only a view icon or "View" button:
Add "✏ Edit" as a second action alongside "👁 View"

**On stat cards and KPI cards that show rates or thresholds:**
Add a small "✏" pencil icon top right of the card — 16px · muted color · on hover turns burgundy
This signals the value is editable

**On section headers that contain editable master data:**
Add "✏ Edit All" ghost link alongside the existing gold right link
Example: "Current Stock Overview" section → right side shows: "✏ Edit Thresholds · See Full Reports →"

**Do not add edit buttons to:**
- Chart sections — charts are view only
- Activity feeds and history logs — immutable
- QC results — immutable
- Audit log entries — immutable

---

## RULE 4 — WEAVERS PAGE — Deactivate Button

On the Weavers page — inside the Weaver Detail side drawer only:

At the bottom of the drawer — below the existing "Send Message" and "Issue New Batch" buttons:

Add: **"🚫 Deactivate This Weaver"**
- Style: ghost button · crimson `#C0392B` border and text · full width · 44px height · icon + text
- Below the button: "Only the Superadmin can deactivate a weaver. This will remove them from active production." — DM Sans 11px muted centered
- This button does NOT appear on weaver cards or in the table — only inside the drawer

---

## RULE 5 — PAYMENTS PAGE — Making Charge Rates Section

On the Payments page — the Making Charge Rates section:

In Admin portal: rates table is read-only with "Request Rate Change" button.

In Superadmin portal:
- Remove the "Request Rate Change" button
- Add "✏ Edit" button on every rate row in the table
- When "✏ Edit" is clicked on a row — a dedicated edit form slides open below that row:

Edit form for one rate row:
- White card · 14px radius · shadow · padding 20px · slides open inline
- Field 1: "Saree Type Name" — pre-filled text input · DM Sans
- Field 2: "Short Code" — pre-filled DM Mono input · e.g. SB-001
- Field 3: "Making Charge Per Saree (₹)" — number input with ₹ prefix · large · pre-filled
- Note: "Changing this rate will affect all future payment calculations. Past payments will not change." — DM Sans 11px muted
- Two buttons: "✓ Save Rate Change" burgundy filled · "× Cancel" ghost
- After save: row updates · a "Changed" timestamp chip appears on the row · DM Mono 9px muted · "Last changed: today"

---

## RULE 6 — OVERVIEW PAGE

Keep identical to Admin Overview page. Same stats, same sections, same layout.

Only changes:
- Gold avatar top right (Rule 2)
- More ⋯ navigation (Rule 1)
- Edit pencil icons on editable KPI cards (Rule 3)
- Page eyebrow label: "SINCE 1999 · SUPERADMIN OVERVIEW" instead of any admin label

---

## RULE 7 — MATERIALS PAGE

Same as Admin Materials page with these additions:

**Stock alert thresholds are editable:**
On the Alerts Card — "Set Alert Thresholds →" link is active and prominent (in Admin it was read-only)
Clicking it opens an inline edit panel showing all material thresholds with editable number inputs

**Jari section fully editable:**
Every Jari batch row has "✏ Edit" button in the actions column
Bun/Reel conversion formula visible and editable: "1 Bun = 4 Reels · ✏ Edit Conversion"

**Vendor details editable:**
In the Purchase History vendor table — every vendor row has "✏ Edit Vendor" button

All other content identical to Admin Materials page.

---

## RULE 8 — WEAVERS PAGE

Same as Admin Weavers page with these additions:

**Weaver cards:** Each card has "✏ Edit" button alongside "👁 View Details"

**Warp request approval:** Superadmin can also approve/reject — same approve/reject buttons visible as in Admin

**Making charge rate visible on weaver cards:** Small chip showing "Rate: ₹450/saree · SB-001" — DM Mono 10px gold background — since superadmin controls rates

**Add New Weaver form:** Fully accessible — same as Admin. No restriction.

**Deactivate button:** Only inside weaver detail drawer (Rule 4)

**Weaver detail drawer — additional fields visible to Superadmin only:**
- Full bank account number unmasked (Admin sees masked ××××)
- Full IFSC code
- Label on these fields: "🔒 Visible to Superadmin only" — DM Mono 9px muted

---

## RULE 9 — PRODUCTION PAGE

Same as Admin Production page with all 16 client changes already applied (rough quotation removed, new flow applied) with these additions:

**Batch cards:** "✏ Edit Batch" button alongside "👁 View Details"

**Design Library:** "✏ Edit Design" button on every design card alongside "👁 View Details"

**Saree type short codes visible on batch cards:** Small editable chip showing the short code and rate — "SB-001 · ₹450/saree · ✏" — superadmin can edit the rate directly

---

## RULE 10 — HISTORY PAGE

Same as Admin History page (Production History).

Additions:
- Every history row has "👁 View" action — no edit (history is immutable)
- Superadmin sees an additional column: "Approved By" — showing which superadmin or admin actioned this record
- Download button fully accessible

---

## RULE 11 — PAYMENTS PAGE

Same as Admin Payments page with these additions beyond Rule 5:

**Firm selector mandatory on every payment form:** (from Change 9 in client corrections) — same for both Admin and Superadmin but Superadmin can also add/edit the 6 firm names

**Add "Manage Firms" button** at the top of the Firm-wise Payment Summary section:
"⚙ Manage Firms" — ghost button · clicking opens a simple management panel:
- List of 6 firms with name and edit/delete options
- "Add New Firm" button at bottom
- Simple form: Firm Name · Registration Number · Notes

**Weaver payment rates visible and editable** (Rule 5 — dedicated edit form per rate row)

**Full payment amounts unmasked:** Admin sees some values partially masked for privacy. Superadmin sees all amounts in full with no masking.

---

## RULE 12 — REPORTS PAGE

Same as Admin Reports page with these additions:

**All 8 report categories fully accessible** — no restrictions

**Scheduled reports:** Superadmin can add, edit, pause, and delete any scheduled report. Admin can only pause. Add "🗑 Delete" option on each schedule card for Superadmin.

**Download history:** Shows who generated each report — "Generated by: Admin (BK)" or "Generated by: Superadmin (SA)"

**Additional report visible to Superadmin only:**
In the report tabs — add one more tab at the end:
📋 "Firm-wise Payments" — shows payment breakdown per firm (the 6 legal entities)
This tab is not visible to Admin

---

## RULE 13 — CUSTOMERS PAGE

Same as Admin Customers page with these additions:

**Wholesale customer cards:** "✏ Edit" button alongside "👁 View" and "📊 Report"

**Customer modal — Edit Profile tab:** Fully accessible and editable by Superadmin (Admin can also edit but Superadmin sees additional fields)

**Additional field visible to Superadmin only in customer modal:**
- "Credit Notes / Special Terms" — any special pricing or terms agreed for this customer
- Label: "🔒 Superadmin only" — DM Mono 9px muted

**Payment terms editable directly:** Superadmin can change the 30/60/90 day terms per customer inline without going through the customer modal

---

## VISUAL CONSISTENCY RULES — Apply to All 8 Pages

**1 — Gold avatar top right on every page:** Consistent on all 8 shared pages — gold circle "SA" replacing burgundy "BK · Admin"

**2 — "More ⋯" dropdown in navigation:** Consistent on all 8 shared pages

**3 — Edit buttons follow this style throughout:**
- "✏ Edit" — ghost button · burgundy `#6B1A2A` border 1px · burgundy text · 10px border radius · padding 6px 14px · DM Sans 500 12px · icon + text
- Never crimson or gold — always burgundy ghost for edit actions
- Save buttons: burgundy filled
- Cancel buttons: ghost no border

**4 — "Superadmin Only" field labels:**
Wherever content is visible only to Superadmin and not Admin:
Small label: "🔒 Superadmin only" — DM Mono 9px · `#8B7060` muted · appears below the field value
This clearly marks what is exclusive to superadmin

**5 — Page eyebrow label on all compact headers:**
Admin portal: "SINCE 1999 · [PAGE NAME]"
Superadmin portal: "SINCE 1999 · SUPERADMIN · [PAGE NAME]"
Example: "SINCE 1999 · SUPERADMIN · WEAVER MANAGEMENT"

---

## WHAT NOT TO CHANGE

- All page layouts — identical to Admin
- All section ordering — identical to Admin
- All photography — identical to Admin
- All chart styles — identical to Admin
- All color palette — identical to Admin
- All typography — identical to Admin
- All card patterns — identical to Admin
- All content and data — identical to Admin
- The 16 client corrections already applied to Admin — carry forward to Superadmin identically
- Firm name "Beere Keshava & Brothers Silks · Est. 1999" — same everywhere

---

## DELIVERABLE

8 complete Superadmin portal pages:
1. Overview
2. Materials
3. Weavers
4. Production
5. History
6. Payments
7. Reports
8. Customers

Each page looks visually identical to the Admin version with only the specific superadmin additions applied. Gold avatar consistent. More ⋯ navigation consistent. Edit buttons placed correctly. Deactivate weaver only in drawer. Rate edit form working. Firm management accessible. Superadmin-only fields labeled.

---

Paste this prompt into Figma Make and attach all 7 Admin dashboard screenshots as reference. This is Prompt 1 of 4 for the complete Superadmin portal. After this is generated and approved, Prompts 2, 3, and 4 will cover the 3 exclusive Superadmin pages — Rates & Pricing, Approvals, and Audit Log.