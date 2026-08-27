# WhatsApp Integration via AiSensy — Complete Implementation Guide

Scope: replace the fixed-OTP login with real WhatsApp OTP, send documents to
suppliers/vendors/wholesale customers, send free-form WhatsApp messages from the
portal, deliver weekly/monthly reports to admins, and push retail bill summaries
to the SuperAdmin after every shop sale.

Target stack: NestJS 11 + Prisma 7 backend (`backend/`), React frontend (`frontend/`).

---

## Part 0 — How AiSensy actually works (read this first)

AiSensy is a Meta-authorised BSP (Business Solution Provider). You never call
Meta's Graph API directly; you call AiSensy, and AiSensy calls Meta. Three
concepts control everything:

**1. Templates.** WhatsApp does not let you send arbitrary text to a user who
has not messaged you in the last 24 hours. You must send a *template* that Meta
pre-approved. Templates have a category:

| Category | Use for | Notes |
|---|---|---|
| `AUTHENTICATION` | Login OTP | Cheapest, fastest approval, has a built-in copy-code button |
| `UTILITY` | Bills, order updates, report delivery, documents | Must be transactional and tied to an existing relationship |
| `MARKETING` | Promotions | Needs opt-in, most expensive, most rejections |

**2. Campaigns.** AiSensy wraps each template in a *Live API Campaign*. The API
takes a `campaignName`, not a template name. If you create the template but
forget the campaign, every API call fails with "Campaign not found". This is the
single most common integration mistake.

**3. The 24-hour session window.** If a user replies to your WhatsApp message, a
24-hour window opens in which you can send free-form (non-template) text. Once
it closes, you are back to templates only. This directly shapes your "send a
custom message from the portal" feature — see Part 6.

**Billing.** Meta charges per 24-hour *conversation*, per category, not per
message. Ten utility messages to one supplier inside 24 hours = one utility
conversation. Authentication conversations in India are currently the cheapest
tier. Budget accordingly: OTP volume = login volume.

---

## Part 1 — AiSensy dashboard setup (do this before writing code)

### 1.1 Confirm your WABA is live
Log in at `https://app.aisensy.com`. Top bar should show your verified business
name and a green connected status. Confirm under **Manage → WhatsApp Account**:
- Business verification: **Verified** (you said Meta verification is done)
- Display name: approved
- Quality rating: **Green** (if it is yellow/red your messaging limits are
  throttled and OTPs will start failing intermittently)
- Messaging limit tier: note the number (1K / 10K / 100K per 24h). A new WABA
  starts at 1,000 unique recipients/24h — plenty for you, but it caps how fast
  you can bulk-send.

### 1.2 Generate the API key
**Manage → API Key → Create/Copy API Key.**

- It is a long JWT-looking string. It does **not** expire on a schedule, but
  regenerating it instantly invalidates the old one.
- Treat it as a root credential — it can send messages billed to your account.
- Never put it in the frontend, never commit it, never expose it through any
  endpoint. It lives only in the backend environment.

### 1.3 Create the templates
**Manage → Template Messages → Create Template.** Create these five. Language:
English (`en`) or English (India) `en_IN` — whichever you pick, stay consistent.

---

**Template 1 — `bk_login_otp`** · Category: `AUTHENTICATION`

AiSensy's authentication template builder is a fixed form; you do not free-type
the body. Configure:
- Body: "*{{1}}* is your verification code." (this text is Meta-fixed)
- Security disclaimer: enabled → appends "For your security, do not share this code."
- Expiry: enabled, 5 minutes → appends "This code expires in 5 minutes."
- Button: **Copy code** (zero-tap is possible but requires an app; use copy-code)

Variable `{{1}}` = the OTP. Note: for authentication templates the OTP variable
must **also** be passed as the button parameter — the AiSensy campaign handles
this if you configure the campaign correctly (Part 1.4).

Approval time: usually minutes.

---

**Template 2 — `bk_document_share`** · Category: `UTILITY` · Header: `DOCUMENT`

```
Header: [DOCUMENT attachment]

Body:
Hello {{1}},

Please find attached the {{2}} from Beere Kesava Silks.

Reference: {{3}}
Date: {{4}}

For any queries, reply to this message.
```

Variables: 1=recipient name, 2=document type ("Purchase Order", "Invoice",
"Quotation"), 3=document number, 4=date, 5=your firm name.

Used for: sending POs to suppliers, invoices to wholesale customers, vendor
bills, quotations.

---

**Template 3 — `bk_report_delivery`** · Category: `UTILITY` · Header: `DOCUMENT`

```
Header: [DOCUMENT attachment]

Body:
Hello {{1}},

Your {{2}} report for the period {{3}} is ready.

Total Sales: ₹{{4}}
Outstanding: ₹{{5}}

Generated on {{6}}.
```

Variables: 1=admin name, 2=Weekly/Monthly, 3=period label, 4=sales total,
5=outstanding, 6=generated timestamp.

> Caution: currency symbols and newlines are fine, but Meta rejects templates
> with **consecutive** variables (`{{1}} {{2}}` with nothing between is OK;
> `{{1}}{{2}}` is not), variables at the very start or very end of the body, and
> any variable that could be interpreted as a URL. Keep static text around every
> placeholder.

---

**Template 4 — `bk_retail_bill`** · Category: `UTILITY`

```
Body:
New Retail Sale — {{1}}

Bill No: {{2}}
Customer: {{3}}
Items: {{4}}
Amount: ₹{{5}}
Payment Mode: {{6}}
Billed by: {{7}}

Beere Kesava Silks
```

Variables: 1=store/firm name, 2=invoice number, 3=customer name, 4=item count,
5=grand total, 6=payment mode, 7=staff name.

---

**Template 5 — `bk_generic_notice`** · Category: `UTILITY`

```
Body:
Hello {{1}},

{{2}}

— Beere Kesava Silks
```

This is your escape hatch for the "send a custom message from the portal"
feature when the recipient is outside the 24-hour window. Variable 2 carries the
staff-typed message.

> Important limitation: a template variable **cannot contain newlines**, tabs,
> or more than 4 consecutive spaces. Meta rejects the send with error 132000 /
> "parameter format mismatch". Your backend must flatten whitespace in any
> user-typed text before putting it in a variable. This is handled in the code
> in Part 6.

### 1.4 Create a Live API Campaign per template
**Campaigns → Create New → API Campaign.** For each template above, create a
campaign and **name it exactly the same as the template** (`bk_login_otp`, etc.).
Same-name convention saves you a mapping table and a lot of debugging.

While creating: select the approved template, do not attach an audience (API
campaigns are triggered per-request), and save. The campaign must be **Live**,
not draft.

### 1.5 Configure the webhook (optional but recommended)
**Manage → Integrations → Webhook.** Point it at
`https://<your-backend>/webhooks/aisensy`. You will receive delivery receipts
(`sent`/`delivered`/`read`/`failed`) and inbound replies. This is what powers
the 24-hour-window tracking in Part 6. Note that webhooks are gated to paid
tiers on AiSensy — confirm yours includes it.

---

## Part 2 — The API contract

Single endpoint for sending:

```
POST https://backend.aisensy.com/campaign/t1/api/v2
Content-Type: application/json
```

```jsonc
{
  "apiKey": "<your api key>",
  "campaignName": "bk_document_share",
  "destination": "919876543210",      // country code, no +, no spaces
  "userName": "Beere Kesava Silks",   // your business display name
  "templateParams": ["Ramesh", "Purchase Order", "PO-2026-0042", "24-08-2026"],
  "source": "erp-portal",             // free-text tag for your own analytics
  "media": {                          // only if the template has a media header
    "url": "https://your-cdn/po-2026-0042.pdf",
    "filename": "PO-2026-0042.pdf"
  },
  "tags": ["purchase-order"],
  "attributes": { "poId": "..." }     // stored against the contact in AiSensy
}
```

Rules that will bite you if ignored:

- **`templateParams` is positional and must match the template's variable count
  exactly.** One extra or missing entry = rejection. Every entry must be a
  string — numbers must be `String(n)`.
- **`destination` must be E.164 without the `+`.** Your DB stores 10-digit
  Indian numbers (see `AuthService.cleanPhone`), so you must prefix `91`.
- **`media.url` must be publicly reachable over HTTPS** with a correct
  `Content-Type`. Meta's servers fetch it — a URL behind your JWT auth guard
  will silently fail. Your current setup serves `/uploads` as static Express
  files, which works *if* the backend is on a public HTTPS host. See Part 5.1
  for the signed-URL approach if you want them protected.
- PDF cap is 100 MB, image 5 MB, but keep documents under ~5 MB for reliable
  delivery on rural connections.

**Response.** HTTP 200 with `{"success": true, ...}` on accept. Note carefully:
200 means *AiSensy queued it*, **not that WhatsApp delivered it**. Actual
delivery outcome only arrives via the webhook. Failures return 4xx with a
`message` string — log it verbatim, the messages are specific and useful
("Campaign not found", "Template params mismatch", "Invalid destination").

---

## Part 3 — Backend foundation

### 3.1 Environment variables

Add to `backend/.env` (and to your Render environment group — you deploy via
`render.yaml`):

```
AISENSY_API_KEY=eyJhbGciOi...
AISENSY_API_URL=https://backend.aisensy.com/campaign/t1/api/v2
AISENSY_SENDER_NAME=Beere Kesava Silks
WHATSAPP_ENABLED=true
WHATSAPP_DEFAULT_COUNTRY_CODE=91
PUBLIC_BASE_URL=https://your-backend.onrender.com
SUPERADMIN_WHATSAPP=919999999999
```

Then extend `backend/src/config/env.validation.ts`. Your current class hard-fails
on missing properties (`skipMissingProperties: false`), so mark the optional ones:

```ts
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min, validateSync } from "class-validator";

class EnvironmentVariables {
  // ... existing DATABASE_URL, DIRECT_URL, PORT ...

  @IsString()
  @IsNotEmpty()
  AISENSY_API_KEY!: string;

  @IsString()
  @IsNotEmpty()
  AISENSY_SENDER_NAME!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  AISENSY_API_URL?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_ENABLED?: string;

  @IsOptional()
  @IsString()
  SUPERADMIN_WHATSAPP?: string;
}
```

`WHATSAPP_ENABLED=false` is your kill switch: the service short-circuits to a
log line so local dev and tests never spend money or hit rate limits.

### 3.2 Prisma models

Append to `backend/prisma/schema.prisma`:

```prisma
enum WhatsAppMessageStatus {
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
}

enum WhatsAppMessageKind {
  OTP
  DOCUMENT
  REPORT
  RETAIL_BILL
  MANUAL
}

model WhatsAppMessage {
  id            String                @id @default(uuid())
  kind          WhatsAppMessageKind
  campaignName  String
  destination   String                // E.164 without '+'
  templateParams Json?
  mediaUrl      String?
  status        WhatsAppMessageStatus @default(QUEUED)
  providerId    String?               // AiSensy/Meta message id from webhook
  errorMessage  String?
  attempts      Int                   @default(0)

  // Loose links — kept nullable so a failed send never blocks a business op
  relatedType   String?               // "PurchaseOrder" | "Invoice" | "SaleRecord"
  relatedId     String?
  sentById      String?
  sentBy        User?                 @relation(fields: [sentById], references: [id])

  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  @@index([destination])
  @@index([status])
  @@index([relatedType, relatedId])
}

// Tracks the rolling 24-hour free-form window per contact
model WhatsAppSession {
  id             String   @id @default(uuid())
  phoneNumber    String   @unique
  lastInboundAt  DateTime
  updatedAt      DateTime @updatedAt
}
```

Add the back-relation on `User`: `whatsappMessages WhatsAppMessage[]`.

Also change `ScheduledReport` — it currently only has `recipientEmail`:

```prisma
model ScheduledReport {
  // ... existing fields ...
  recipientEmail String?              // was required; now optional
  recipientPhone String?              // NEW — E.164 without '+'
  channel        String  @default("WHATSAPP")  // "WHATSAPP" | "EMAIL" | "BOTH"
}
```

Then: `npm run db:push` (your script wraps `prisma db push`).

### 3.3 The core service

Create `backend/src/whatsapp/`.

**`whatsapp.types.ts`**
```ts
export interface SendTemplateInput {
  campaignName: string;
  destination: string;          // raw phone; normalised inside the service
  templateParams?: string[];
  media?: { url: string; filename: string };
  kind: WhatsAppMessageKind;
  relatedType?: string;
  relatedId?: string;
  sentById?: string;
  tags?: string[];
}
```

**`whatsapp.service.ts`** — the only place in the codebase that talks to AiSensy.

```ts
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppMessageKind, WhatsAppMessageStatus } from "../generated/prisma/client";

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get enabled(): boolean {
    return this.config.get<string>("WHATSAPP_ENABLED") !== "false";
  }

  /**
   * DB stores bare 10-digit Indian numbers (see AuthService.cleanPhone).
   * AiSensy needs E.164 without '+'. Anything already carrying a country
   * code (12 digits starting 91) is passed through untouched.
   */
  normalise(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    const cc = this.config.get<string>("WHATSAPP_DEFAULT_COUNTRY_CODE") ?? "91";
    if (digits.length === 10) return `${cc}${digits}`;
    if (digits.length > 10) return digits.slice(-12);
    throw new Error(`Cannot normalise phone number: ${phone}`);
  }

  /**
   * Template variables cannot contain newlines, tabs, or 4+ consecutive
   * spaces — Meta rejects the send outright. Always run user-typed text
   * through this before it becomes a templateParam.
   */
  sanitiseParam(value: string): string {
    return value.replace(/\s+/g, " ").trim().slice(0, 900);
  }

  async sendTemplate(input: SendTemplateInput) {
    const destination = this.normalise(input.destination);

    const record = await this.prisma.whatsAppMessage.create({
      data: {
        kind: input.kind,
        campaignName: input.campaignName,
        destination,
        templateParams: input.templateParams ?? [],
        mediaUrl: input.media?.url,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        sentById: input.sentById,
      },
    });

    if (!this.enabled) {
      this.logger.log(`[WA disabled] ${input.campaignName} -> ${destination}`);
      return record;
    }

    const body = {
      apiKey: this.config.get<string>("AISENSY_API_KEY"),
      campaignName: input.campaignName,
      destination,
      userName: this.config.get<string>("AISENSY_SENDER_NAME"),
      templateParams: (input.templateParams ?? []).map(String),
      source: "erp-portal",
      ...(input.media ? { media: input.media } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
    };

    try {
      const res = await fetch(
        this.config.get<string>("AISENSY_API_URL") ??
          "https://backend.aisensy.com/campaign/t1/api/v2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        },
      );

      const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        const message = String(payload.message ?? `HTTP ${res.status}`);
        await this.prisma.whatsAppMessage.update({
          where: { id: record.id },
          data: {
            status: WhatsAppMessageStatus.FAILED,
            errorMessage: message,
            attempts: { increment: 1 },
          },
        });
        this.logger.error(`AiSensy send failed (${input.campaignName}): ${message}`);
        return { ...record, status: WhatsAppMessageStatus.FAILED, errorMessage: message };
      }

      return this.prisma.whatsAppMessage.update({
        where: { id: record.id },
        data: {
          status: WhatsAppMessageStatus.SENT,
          providerId: typeof payload.messageId === "string" ? payload.messageId : null,
          attempts: { increment: 1 },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown transport error";
      await this.prisma.whatsAppMessage.update({
        where: { id: record.id },
        data: {
          status: WhatsAppMessageStatus.FAILED,
          errorMessage: message,
          attempts: { increment: 1 },
        },
      });
      this.logger.error(`AiSensy transport error: ${message}`);
      return { ...record, status: WhatsAppMessageStatus.FAILED, errorMessage: message };
    }
  }
}
```

Two design decisions worth stating explicitly:

- **Send failures do not throw** for business flows. A WhatsApp outage must
  never roll back a retail sale or a PO creation. The failure is persisted as a
  `FAILED` row you can retry. The one exception is OTP — there, failure *must*
  surface to the user, so the auth flow checks the returned status (Part 4).
- **Every send is persisted before the HTTP call.** That gives you an audit
  trail, a retry queue, and a per-recipient rate-limit source of truth.

**`whatsapp.module.ts`**
```ts
@Global()          // many modules need it; @Global avoids 12 import lines
@Module({
  imports: [PrismaModule],
  providers: [WhatsAppService],
  controllers: [WhatsAppController, WhatsAppWebhookController],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
```

Register it in `app.module.ts` **before** `AuthModule` in the imports array so
the auth service can inject it.

---

## Part 4 — Feature 1: WhatsApp OTP login

### 4.1 What changes in `auth.service.ts`

Your current `requestOtp` hardcodes `"123456"` and `verifyOtp` has this bug:

```ts
if (dto.code !== "123456" || dto.code !== otpRow.code) {
```

That `||` is always true for any input (a string cannot simultaneously equal
and not equal `"123456"` — if the code *is* `123456` the first clause is false
but the second is only false when the row also holds `123456`; if the code is
anything else the first clause is true). It happens to work today only because
the stored code is always `123456`. With random OTPs it would reject everything.
Replace it with a single comparison against the stored row.

### 4.2 Rewritten `requestOtp`

```ts
private generateOtp(): string {
  // crypto.randomInt is uniform; Math.random is not, and OTPs are a
  // credential — never generate them with Math.random.
  return String(randomInt(100_000, 1_000_000));
}

async requestOtp(dto: RequestOtpDto) {
  const phone = this.cleanPhone(dto.phone);
  await this.ensureDefaultUsers();

  const user = await this.prisma.user.findFirst({ where: { mobile: { contains: phone } } });
  const weaver = !user
    ? await this.prisma.weaver.findFirst({ where: { phone: { contains: phone } } })
    : null;

  // Only registered numbers get an OTP. Sending to unknown numbers burns
  // authentication conversations and is an open relay for abuse.
  if (!user && !weaver) {
    throw new UnauthorizedException("This mobile number is not registered.");
  }

  // Resend throttle: one OTP per 60s, max 5 per hour per number.
  const recent = await this.prisma.otpCode.findMany({
    where: { phoneNumber: phone, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < 60_000) {
    throw new HttpException("Please wait 60 seconds before requesting another OTP.", 429);
  }
  if (recent.length >= 5) {
    throw new HttpException("Too many OTP requests. Try again in an hour.", 429);
  }

  const code = this.generateOtp();
  const expiresAt = new Date(Date.now() + this.otpTtlMs);

  // Invalidate all outstanding OTPs, then issue exactly one. Updating the
  // existing row in place (the old behaviour) leaves stale rows usable if
  // two requests race.
  await this.prisma.otpCode.updateMany({
    where: { phoneNumber: phone, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const otpRow = await this.prisma.otpCode.create({
    data: { phoneNumber: phone, code: await bcrypt.hash(code, 10), expiresAt },
  });

  const result = await this.whatsapp.sendTemplate({
    campaignName: "bk_login_otp",
    destination: phone,
    templateParams: [code],
    kind: WhatsAppMessageKind.OTP,
  });

  if (result.status === WhatsAppMessageStatus.FAILED) {
    await this.prisma.otpCode.update({
      where: { id: otpRow.id },
      data: { consumedAt: new Date() },
    });
    throw new ServiceUnavailableException(
      "Could not send OTP on WhatsApp. Please try again shortly.",
    );
  }

  return { success: true, message: "OTP sent on WhatsApp", phone, exists: true };
}
```

Note the OTP is **hashed at rest** with bcrypt. An OTP is a login credential;
a DB leak should not hand over live sessions. Verify with `bcrypt.compare`.

### 4.3 Rewritten verification check

```ts
const matches = await bcrypt.compare(dto.code, otpRow.code);
if (!matches) {
  await this.prisma.otpCode.update({
    where: { id: otpRow.id },
    data: { attempts: { increment: 1 } },
  });
  throw new UnauthorizedException("Invalid OTP code.");
}
```

Delete the "Please use 123456" hint from the error message.

### 4.4 The unknown-phone fallback must go

`verifyOtp` currently ends with: unknown phone → silently log in as the
SuperAdmin. That was acceptable while the OTP was a fixed public constant and
the whole thing was a demo. Once real OTPs go live it becomes the opposite of a
security control — anyone whose number reaches a WhatsApp inbox gets full
SuperAdmin access. Since 4.2 now rejects unregistered numbers at request time,
delete the entire `else` branch and throw `UnauthorizedException` instead.

Keep the `9999999999` / `8888888888` seed accounts, but treat them as ordinary
registered users, resolved by the normal `user.findFirst` lookup.

### 4.5 Local development

Set `WHATSAPP_ENABLED=false`. The service logs instead of sending. Add a
dev-only branch so the OTP is returned in the response when disabled:

```ts
...(this.enabled ? {} : { devOtp: code }),
```

Guard it on `NODE_ENV !== "production"` as well — belt and braces on something
that would be catastrophic to ship.

---

## Part 5 — Feature 2: sending documents

### 5.1 Make the file publicly fetchable

Meta's servers fetch `media.url` anonymously. Your `/uploads` static mount is
already public, so the simplest path works today. But it means anyone with a
guessed filename can read a supplier's invoice.

Recommended: add a short-lived signed URL route.

```ts
// GET /public/docs/:token  — no auth guard, marked @Public()
// token = jwt.sign({ path, exp: now + 900 }, DOC_SIGNING_SECRET)
```

15 minutes is plenty; Meta fetches within seconds. Generate the token at send
time and pass that URL to AiSensy. Old links die on their own.

### 5.2 The send endpoint

`whatsapp.controller.ts`:

```ts
@Post("send-document")
@RequirePermissions("whatsapp.send")
async sendDocument(@Body() dto: SendDocumentDto, @CurrentUser() user: JwtUser) {
  return this.whatsappDocs.send(dto, user.sub);
}
```

`SendDocumentDto`: `{ recipientType: "SUPPLIER" | "VENDOR" | "CUSTOMER" | "WEAVER", recipientId: string, documentType: string, documentId: string }`.

The service resolves the phone from the right table (`supplier.phone`,
`vendor.phone`, `customer.mobile`, `weaver.phone`), generates or looks up the
PDF, builds the signed URL, and calls `sendTemplate`:

```ts
await this.whatsapp.sendTemplate({
  campaignName: "bk_document_share",
  destination: recipient.phone,
  templateParams: [
    this.whatsapp.sanitiseParam(recipient.name),
    documentType,                       // "Purchase Order"
    documentNumber,                     // "PO-2026-0042"
    format(new Date(), "dd-MM-yyyy"),
  ],
  media: { url: signedUrl, filename: `${documentNumber}.pdf` },
  kind: WhatsAppMessageKind.DOCUMENT,
  relatedType: "PurchaseOrder",
  relatedId: documentId,
  sentById: userId,
});
```

Resolve `recipient.phone` defensively — a supplier row with a null or malformed
phone should return a clear 400 ("Supplier has no WhatsApp number on file"),
not a normalisation crash.

### 5.3 Frontend

On the PO / Invoice / Quotation detail pages, add a "Send on WhatsApp" button
next to the existing download action. It should:
1. show the resolved recipient name + masked number in a confirm dialog,
2. POST to `/whatsapp/send-document`,
3. toast the result, and
4. render a small delivery-status chip that polls `/whatsapp/messages?relatedId=`
   so staff can see `Sent → Delivered → Read`.

That last part is what makes the feature trustworthy in daily use — without it,
staff re-send the same PO three times because they cannot tell if it landed.

---

## Part 6 — Feature 3: free-form messages from the portal

This is the feature the 24-hour window governs, so the UI must be honest about it.

**Logic:**

```ts
const session = await this.prisma.whatsAppSession.findUnique({
  where: { phoneNumber: normalised },
});
const windowOpen =
  !!session && Date.now() - session.lastInboundAt.getTime() < 24 * 60 * 60 * 1000;
```

- **Window open** → you may send free-form text. AiSensy exposes this via its
  direct-message API; if your plan does not include it, fall back to the
  template path below. Free-form is preferable: no variable restrictions, so
  newlines and long text survive intact.
- **Window closed** → send `bk_generic_notice` with the message flattened
  through `sanitiseParam()`. Warn the staff member in the UI that formatting
  will be collapsed to a single paragraph and capped at ~900 characters.

`WhatsAppSession.lastInboundAt` is maintained by the webhook (Part 8). Until the
webhook is live, treat every window as closed and always use the template — it
is the safe default.

**Permissions.** Gate this behind a dedicated permission, not a role. Your
`PermissionsGuard` and `@RequirePermissions` decorator already support this.
Free-form outbound messaging to customers on the company's WhatsApp number is
a reputational surface — you want per-user control, and you want every send in
`WhatsAppMessage` with `sentById` populated. It already is.

---

## Part 7 — Feature 4: scheduled admin reports

Your `ReportSchedulerService` already polls every 15 minutes and has the exact
hook you need:

```ts
// TODO(delivery): wire real email/WhatsApp send once a provider is configured.
```

### 7.1 Fix the interval maths first

`FREQUENCY_INTERVAL_MS` uses `30 * 24h` for monthly and compares against
`lastRunAt`. That drifts: a monthly report fires on the 1st, then the 31st, then
the 2nd of the following month. Weekly drifts too, because the 15-minute poll
means each run lands a little later than the last.

Switch to calendar-anchored scheduling using the `nextRunAt` column that already
exists on the model but is never written:

```ts
private computeNextRun(frequency: ReportFrequency, from: Date): Date {
  const next = new Date(from);
  switch (frequency) {
    case ReportFrequency.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case ReportFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case ReportFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  next.setHours(9, 0, 0, 0);   // 09:00 IST delivery
  return next;
}
```

Then `checkDueSchedules` filters on `nextRunAt: { lte: new Date() }` — one
indexed query instead of loading every active schedule into memory and filtering
in JS. Set `nextRunAt` on creation and after each run.

> Timezone: Render runs UTC. `setHours(9)` on a UTC server means 09:00 UTC =
> 14:30 IST. Either set `TZ=Asia/Kolkata` in the Render environment (simplest)
> or do the offset arithmetic explicitly. Pick one and write it in a comment —
> this is the bug that silently sends every report at the wrong time for months.

### 7.2 Wire the delivery

Replace the TODO block:

```ts
const handler = REPORT_NAME_HANDLERS[schedule.reportName] ?? DEFAULT_REPORT_HANDLER;
const reportData = await handler(this.reportsService);

// Render to a file. You already have exceljs for XLSX; add a PDF renderer
// if schedule.format === "PDF".
const file = await this.reportRenderer.render(schedule.reportName, schedule.format, reportData);
const url = this.signedUrl(file.path);

if (schedule.channel !== "EMAIL" && schedule.recipientPhone) {
  await this.whatsapp.sendTemplate({
    campaignName: "bk_report_delivery",
    destination: schedule.recipientPhone,
    templateParams: [
      recipientName,
      schedule.frequency === "WEEKLY" ? "Weekly" : "Monthly",
      periodLabel,                             // "18 Aug – 24 Aug 2026"
      formatCurrency(reportData.totalSales),
      formatCurrency(reportData.outstanding),
      format(new Date(), "dd-MM-yyyy HH:mm"),
    ],
    media: { url, filename: `${schedule.reportName}-${periodLabel}.pdf` },
    kind: WhatsAppMessageKind.REPORT,
    relatedType: "ScheduledReport",
    relatedId: schedule.id,
  });
}
```

Keep writing the `ReportDownloadHistory` row — it is your delivery audit trail.

### 7.3 Multiple recipients

`ScheduledReport` holds a single recipient. Admins plural means you either
create one schedule row per admin (simplest, no schema change beyond 3.2, and it
gives per-admin enable/disable for free) or add a `recipientPhones String[]`.
Recommend the former: one row per admin per report.

### 7.4 Multi-instance safety

If Render ever runs more than one backend instance, `@Cron` fires on **every**
instance and every admin gets duplicate reports. Guard it with a conditional
update that acts as a lock:

```ts
const claimed = await this.prisma.scheduledReport.updateMany({
  where: { id: schedule.id, nextRunAt: { lte: new Date() } },
  data: { nextRunAt: this.computeNextRun(schedule.frequency, new Date()) },
});
if (claimed.count === 0) return;   // another instance took it
```

Claim first, then generate. Worst case you skip a report; you never double-send.

---

## Part 8 — Feature 5: retail bill to SuperAdmin

In `SalesService.createSale`, after the sale transaction **commits**:

```ts
// Fire-and-forget: a WhatsApp failure must never fail or roll back a sale.
// sendTemplate persists its own failures, so nothing is lost.
void this.notifyRetailSale(sale).catch((error) =>
  this.logger.error(`Retail bill WhatsApp notify failed: ${error.message}`),
);

return sale;
```

```ts
private async notifyRetailSale(sale: SaleRecord) {
  const recipients = await this.prisma.user.findMany({
    where: { role: UserRole.SUPERADMIN, mobile: { not: null } },
  });

  for (const admin of recipients) {
    await this.whatsapp.sendTemplate({
      campaignName: "bk_retail_bill",
      destination: admin.mobile,
      templateParams: [
        this.whatsapp.sanitiseParam(sale.firmName ?? "Beere Kesava Silks"),
        sale.invoiceNumber,
        this.whatsapp.sanitiseParam(sale.customerName ?? "Walk-in"),
        String(sale.itemCount),
        formatCurrency(sale.grandTotal),
        sale.paymentMode,
        this.whatsapp.sanitiseParam(staffName),
      ],
      kind: WhatsAppMessageKind.RETAIL_BILL,
      relatedType: "SaleRecord",
      relatedId: sale.id,
    });
  }
}
```

**Placement matters.** Put this *after* the Prisma transaction resolves, never
inside it. Inside a transaction, the HTTP call holds a DB connection open for
up to 15 seconds and an AiSensy timeout aborts the sale.

**Volume warning.** One message per sale per SuperAdmin. A busy shop day is 80
sales — 80 messages, though they collapse into a small number of billable
24-hour conversations. Still, consider offering a per-admin preference:
immediate, or a 6 PM daily digest. Digest is usually what owners actually want
after week one; build immediate first, add the digest toggle when they ask.

---

## Part 9 — The webhook

`whatsapp-webhook.controller.ts`, marked `@Public()`:

```ts
@Public()
@Post("webhooks/aisensy")
async handle(@Body() body: AiSensyWebhookDto, @Headers("x-webhook-token") token: string) {
  // AiSensy does not sign payloads. Put a shared secret in the URL or a
  // custom header and reject anything else — this endpoint is unauthenticated
  // and writes to your DB.
  if (token !== this.config.get("AISENSY_WEBHOOK_SECRET")) {
    throw new UnauthorizedException();
  }
  ...
}
```

Handle two event families:

**Status updates** → map to `WhatsAppMessageStatus` and update the row matched
by `providerId`. Statuses arrive out of order; never downgrade (`READ` must not
be overwritten by a late `DELIVERED`). Enforce with a rank check.

**Inbound messages** → upsert `WhatsAppSession.lastInboundAt = now`. This is
what opens the 24-hour window in Part 6.

Always return 200 quickly. Webhook providers retry on non-2xx, and a slow
handler causes duplicate deliveries. Do the work, or enqueue it, in under a
second.

---

## Part 10 — Rollout order

Build in this sequence; each stage is independently shippable and each one
de-risks the next.

1. **Foundation** — env vars, Prisma models, `WhatsAppService`, module wiring.
   Ship with `WHATSAPP_ENABLED=false`. Nothing sends; nothing breaks.
2. **Templates** — submit all five to Meta on day one. Approval is the only part
   you cannot control, so start the clock immediately. Build the code while you
   wait.
3. **Retail bill to SuperAdmin** — lowest risk (one internal recipient, no
   media, no auth impact). Turn on `WHATSAPP_ENABLED=true` for this alone and
   verify end to end on a real phone.
4. **Documents** — needs the signed-URL work; test that Meta can actually fetch
   your URL from outside your network before wiring the UI.
5. **Scheduled reports** — the interval and timezone fixes matter more than the
   sending. Test by temporarily setting `nextRunAt` to a past timestamp.
6. **OTP login** — do this **last** and behind a feature flag. It is the only
   feature that can lock every user out of the portal. Keep the old fixed-OTP
   path available behind `OTP_MODE=fixed|whatsapp` for one release, so you can
   flip back in seconds if delivery degrades.
7. **Webhook + free-form messaging** — needs steps 1–6 producing real messages
   before the status data is worth anything.

---

## Part 11 — Things that will go wrong, and what they mean

| Symptom | Cause | Fix |
|---|---|---|
| `Campaign not found` | Template approved but no Live API Campaign | Create the campaign; name it exactly as in code |
| `Template params mismatch` | Wrong count, or a non-string in `templateParams` | `.map(String)`; count placeholders in the approved template |
| Send returns 200, nothing arrives | Number not on WhatsApp, or Meta silently dropped it | Check the webhook `failed` event for the real reason |
| Media never attaches | URL not publicly reachable, or wrong Content-Type | `curl -I` the URL from outside your network |
| OTP arrives with no copy button | Template built as UTILITY, not AUTHENTICATION | Recreate as AUTHENTICATION; category cannot be edited |
| Messages stop after N sends | Hit the 24h messaging tier cap | Check quality rating; tier grows automatically with good ratings |
| Template rejected by Meta | Variable at start/end of body, or consecutive variables | Add static text around every placeholder |
| Everything worked, then stopped | API key regenerated in the dashboard | Rotate the env var |

**Watch the quality rating.** It is the thing that quietly kills WhatsApp
integrations. Users blocking or reporting your number drops it to yellow, then
red, then Meta restricts your sending. Prevention: only message registered
contacts, keep utility templates genuinely transactional, and never route
marketing content through a utility template.

---

## Part 12 — Testing

Unit-test `WhatsAppService` with `fetch` mocked — cover normalisation (10-digit,
12-digit, malformed), `sanitiseParam` whitespace collapsing, the disabled
short-circuit, and that a non-2xx response persists `FAILED` rather than
throwing.

Integration-test the auth flow with `WHATSAPP_ENABLED=false` and the dev-OTP
escape hatch, so your existing `auth.service.spec.ts` keeps passing without a
network.

Before go-live, run one real send per template to your own number and confirm:
rendering, the copy-code button, that the document opens, and that the webhook
records `delivered`.
