## FIGMA MAKE PROMPT

### BKB Silk ERP — Login Page (OTP Authentication)

---

You are designing the **Login Page** for the **Beere Keshava & Brothers Silks ERP system** — a premium Indian silk manufacturing firm established in **1999**. This login page is the entry point for all 6 user portals — Superadmin, Admin, Worker Staff, Finishing Staff, Weaver, and Shop Staff.

**Attach the Admin Dashboard Overview screenshot as the visual reference when running this prompt.**

The login page must feel like it belongs to the same premium brand as the dashboard — same colors, same typography, same warmth. It should feel trustworthy and easy to use for people who are not very comfortable with digital products.

---

## DESIGN SYSTEM — Apply Exactly

**Colors:**

- Page background: `#FFFFFF` white
- Primary burgundy: `#6B1A2A`
- Dark section background: `#3D0E1A`
- Gold accent: `#C4923A`
- Text primary: `#1A0A0F`
- Text secondary: `#3D2030`
- Text muted: `#8B7060`
- Green success: `#1E6640`
- Crimson error: `#C0392B`
- Card background: `#FFFFFF`
- Input background: `#FFF8E7` warm cream
- Border: `rgba(139,26,46,0.15)`

**Typography:**

- Brand heading: Playfair Display 700 — for firm name and main heading
- Italic accent: Playfair Display 500 italic — for sub-headings
- UI text: DM Sans 400/500/600 — for all labels, descriptions, buttons
- Codes and OTP digits: DM Mono 500 — for the OTP input boxes

**Card style:** White background, `1px solid rgba(139,26,46,0.12)` border, `border-radius 20px`, `box-shadow 0 8px 40px rgba(44,24,16,0.12)`

**Button style:** `border-radius 999px` pill shape, always icon + text label

---

## PAGE LAYOUT

**Full screen layout — two columns side by side:**

**Left column — 45% width:**
Dark brand panel. Background: deep burgundy `#3D0E1A` with a subtle diagonal texture pattern overlay (`rgba(196,146,58,0.03)` repeating). Occupies full viewport height.

**Right column — 55% width:**
White background. Contains the login form. Vertically and horizontally centered content.

---

## LEFT COLUMN — BRAND PANEL

**Background:** `#3D0E1A` deep burgundy
**Two decorative concentric circle outlines:** bottom right corner — `rgba(196,146,58,0.07)` and `rgba(196,146,58,0.04)` — same decorative pattern as dashboard header

**Content — vertically centered, padding 64px:**

**Top — brand identity:**

- Lotus icon: 48px × 48px white lotus SVG — same as dashboard logo
- Below icon: "Beere Keshava" — Playfair Display 700 32px color `#F5EDD0`
- "& Brothers Silks" — Playfair Display 500 20px color `rgba(245,237,208,0.70)`
- "Since 1999" — DM Mono 11px letter-spacing 3px uppercase color `var(--gold)` `#C4923A`

**Middle — large brand statement:**
Margin top 48px.

- "Weaving" — Playfair Display 700 52px white
- "Heritage" — Playfair Display 700 52px italic color `#C4923A` gold
- "Into Every" — Playfair Display 700 52px white
- "Thread" — Playfair Display 700 52px white
Line height 1.05. This recreates the hero heading from the dashboard.

**Below heading — description:**
"Four generations of passion, precision, and pure silk craftsmanship. Welcome back." — DM Sans 400 14px color `rgba(245,237,208,0.55)` max-width 340px line-height 1.7. Margin top 20px.

**Bottom of left panel — portal information strip:**
Position: absolute bottom 40px left 64px right 64px.
Dark card: `rgba(255,255,255,0.06)` background, `1px solid rgba(255,255,255,0.10)` border, border-radius 12px, padding 16px 20px.

Title: "This system is used by:" — DM Mono 9px uppercase letter-spacing 2px color `rgba(245,237,208,0.40)` margin-bottom 10px.

6 portal chips in a flex wrap row — each chip: `rgba(196,146,58,0.14)` background, `1px solid rgba(196,146,58,0.25)` border, border-radius 999px, padding 4px 12px, DM Mono 9px letter-spacing 1px color `#C4923A`:
"Superadmin" · "Admin" · "Worker Staff" · "Finishing Staff" · "Weaver" · "Shop Staff"

---

## RIGHT COLUMN — LOGIN FORM

**Background:** `#FFFFFF`**Content:** Vertically centered. Padding 64px.
**Max width of form container:** 420px centered in the column.

---

### STEP 1 — ENTER MOBILE NUMBER (DEFAULT STATE)

**Form card:** White background, 20px border-radius, `box-shadow 0 8px 40px rgba(44,24,16,0.10)`, padding 40px.

**Card top:**

- Small lotus icon: 32px, burgundy `#6B1A2A` tinted background circle 52px, centered
- "Welcome Back" — Playfair Display 600 28px `#1A0A0F` centered, margin-top 14px
- "& Brothers Silks ERP" — DM Sans 400 14px `#8B7060` centered

**Divider line:** `1px solid rgba(139,26,46,0.10)` margin 20px 0

**Form label:**
"Enter Your Mobile Number" — DM Sans 600 14px `#1A0A0F` margin-bottom 8px. NOT "Phone" — full plain words.

**Sub-label below:**
"We will send a 6-digit code to this number. Use the number registered with the system." — DM Sans 400 12px `#8B7060` line-height 1.5 margin-bottom 16px.

**Mobile input field:**
Height: 56px minimum (large touch target)
Background: `#FFF8E7` warm cream
Border: `1px solid rgba(139,26,46,0.20)`
Border-radius: 12px
Padding: 0 16px 0 52px (left space for flag+code)
Font: DM Sans 500 16px `#1A0A0F`
Left side inside input: India flag emoji 🇮🇳 + "+91" — DM Mono 500 14px `#8B7060`
Divider line between flag area and input text
Placeholder text: "98765 43210" — DM Sans 400 16px `rgba(26,10,15,0.30)`

**Focus state:** border changes to `2px solid #6B1A2A` burgundy, background stays cream

**Example text below input:**
"Example: The number your admin registered for you" — DM Sans 400 11px `#8B7060` italic margin-top 6px

**Send OTP button:**
Width: 100%. Height: 52px. Background: `#6B1A2A` burgundy. Border-radius: 999px pill.
Text: "📱 Send OTP to My Number" — DM Sans 600 15px white, icon + text.
Hover: background lightens slightly to `#8B1A2E`

**Below button — info note:**
Small info card: `rgba(196,146,58,0.08)` background, `1px solid rgba(196,146,58,0.20)` border, border-radius 10px, padding 10px 14px.
"ℹ Your OTP will be sent via SMS. If SMS does not arrive within 2 minutes, a WhatsApp message will be sent instead." — DM Sans 400 11px `#8B7060` line-height 1.5.

---

### STEP 2 — ENTER OTP (STATE AFTER NUMBER SUBMITTED)

Show this as a second card state — this appears after the mobile number is entered and OTP is sent. Design both states on the page — Step 1 card on one side or Step 2 card as an alternate view.

**Card top — same as Step 1 but different subtitle:**

- "Check Your Phone" — Playfair Display 600 28px centered
- "We sent a 6-digit code to" — DM Sans 400 13px `#8B7060`
- "+91 98765 43210" — DM Mono 600 15px `#6B1A2A` burgundy — the number entered

**Change number link:** "Change Number" — DM Sans 400 12px `#C4923A` gold underline — right below the number

**OTP Input — 6 separate boxes:**
6 individual square input boxes in a row. Gap: 10px.
Each box: width 52px, height 60px. Background: `#FFF8E7`. Border: `1px solid rgba(139,26,46,0.20)`. Border-radius: 10px.
Font inside: DM Mono 700 24px `#1A0A0F` centered.
Filled box: background stays cream, border changes to burgundy `#6B1A2A` 2px.
Active/focused box: border burgundy 2px, subtle shadow `0 0 0 3px rgba(107,26,42,0.10)`.
Empty boxes show placeholder dot "·" in muted color.

**Timer text below OTP boxes:**
"⏱ Code expires in: 1:48" — DM Mono 500 12px `#8B7060` centered
Timer counts down — show at 1:48 in the design

**Resend link (grayed out while timer active):**
"Did not receive the code? Resend" — DM Sans 400 12px. "Resend" is gold `#C4923A` — grayed out `#8B7060` while timer is active.

**Verify OTP button:**
Width: 100%. Height: 52px. Background: `#6B1A2A`. Border-radius: 999px.
Text: "✓ Verify and Login" — DM Sans 600 15px white.

**WhatsApp fallback link:**
"Not receiving SMS?" with "Send via WhatsApp instead →" — DM Sans 400 12px, WhatsApp part in green `#1E6640`.

---

### SUCCESS STATE (Brief moment before redirect)

Small success card replacing the form momentarily:
Green checkmark circle: 64px, `#1E6640` background, white ✓ icon
"Login Successful!" — Playfair Display 600 22px `#1A0A0F` centered
"Welcome back, Admin. Taking you to your dashboard..." — DM Sans 400 13px `#8B7060` centered
Thin loading progress bar below: gold `#C4923A` fill, animating left to right, height 3px, full card width at bottom

---

### ERROR STATE

When wrong OTP is entered — the 6 OTP boxes shake animation and borders turn crimson `#C0392B`. Below the boxes:

Error message box: `rgba(192,57,43,0.08)` background, `1px solid rgba(192,57,43,0.20)` border, border-radius 8px, padding 10px 14px:
"✗ Incorrect code. Please check and try again. You have 2 more attempts." — DM Sans 500 12px `#C0392B`

OTP boxes clear and user can re-enter.

---

## BELOW THE FORM CARD — Security note

Below the white form card, outside the card, centered:
"🔒 This system is secured. Your login is protected and all activity is recorded." — DM Sans 400 11px `#8B7060` centered.
Margin-top 20px from card.

---

## BOTTOM OF RIGHT COLUMN

Absolute bottom. Centered. Small text:
"© 2026 Beere Keshava & Brothers Silks. All rights reserved." — DM Sans 400 10px `#8B7060`
Below: "Since 1999 · Tradition. Trust. Timeless Quality." — DM Mono 9px `#C4923A` letter-spacing 2px uppercase

---

## MOBILE RESPONSIVE BEHAVIOR

On mobile screen (390px width):

- Left brand panel disappears completely
- Right column becomes full width full screen
- The lotus icon and firm name appear at the top of the form page replacing the left panel branding
- Form card fills the screen with 20px padding on sides
- OTP boxes resize to 44px × 52px each to fit mobile screen

---

## IMPORTANT DESIGN NOTES

**1 — Three states to design:**
Design all three states of the form on the same Figma page — Step 1 (mobile number entry), Step 2 (OTP entry), and Success state. Arrange them left to right or top to bottom so all states are visible together.

**2 — No password field anywhere:**
This is OTP-only authentication. There is absolutely no password input, no "Forgot Password" link, no password-related element anywhere on this page.

**3 — Plain language throughout:**
Every label in full words. "Enter Your Mobile Number" not "Phone". "Send OTP to My Number" not "Send OTP". "Verify and Login" not "Submit". "Check Your Phone" not "Enter OTP". "We sent a 6-digit code" not "OTP sent".

**4 — Large touch targets:**
All inputs minimum 56px height. All buttons minimum 52px height. OTP boxes minimum 52px × 60px each. Designed for fingers, not just mouse.

**5 — Warmth and trust:**
This is a family silk business since 1945. The login page should feel like entering a trusted, heritage establishment — not a cold tech product. Use warm cream backgrounds on inputs, burgundy as the authority color, gold as the warmth accent. Real photography if possible on the left panel — warm silk showroom image similar to the dashboard hero.

---

## WHAT TO DELIVER

One complete Figma Make page showing:

- The full login page in desktop view with both columns
- Step 1 state (mobile number entry) — primary view
- Step 2 state (OTP entry) — shown as alternate card state
- Success state — brief confirmation card
- Error state — OTP boxes in error
- Mobile responsive view shown separately below

Match the visual style exactly to the Admin Dashboard reference screenshot provided. Same fonts, same colors, same warmth, same premium feel.

---

Paste this entire prompt into Figma Make and attach the Admin Dashboard Overview screenshot as the style reference. This will give you a login page that feels like it was designed by the same hand as the entire dashboard system.