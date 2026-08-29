import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WhatsAppMessageStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SendTemplateInput } from "./whatsapp.types";

const DEFAULT_AISENSY_API_URL = "https://backend.aisensy.com/campaign/t1/api/v2";

/**
 * Meta's button component for an AUTHENTICATION template's copy-code button.
 * The sub_type is "url" (not "copy_code") and the parameter is plain text —
 * that is the shape Meta's Cloud API documents for authentication templates,
 * even though the button renders as "Copy Code" rather than a link.
 *
 * Omitting this entirely is what caused every OTP to be accepted by AiSensy
 * and then dropped by Meta with "required parameter is missing".
 */
function buildCopyCodeButton(code: string) {
  return [
    {
      type: "button",
      sub_type: "url",
      index: 0,
      parameters: [{ type: "text", text: code }],
    },
  ];
}

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
   * code (12 digits starting with the configured prefix) passes through.
   */
  normalise(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    const cc = this.config.get<string>("WHATSAPP_DEFAULT_COUNTRY_CODE") ?? "91";
    if (digits.length === 10) return `${cc}${digits}`;
    if (digits.length > 10) return digits.slice(-12);
    throw new Error(`Cannot normalise phone number for WhatsApp: "${phone}"`);
  }

  /**
   * Template variables cannot contain newlines, tabs, or runs of spaces —
   * Meta rejects the send outright (error 132000). Always pass user-typed
   * text through this before it becomes a templateParam.
   */
  sanitiseParam(value: string): string {
    return value.replace(/\s+/g, " ").trim().slice(0, 900);
  }

  async sendTemplate(input: SendTemplateInput) {
    // An unusable number is a FAILED message, not an exception. normalise()
    // used to be called bare here, so a customer saved without a phone (the
    // retail flow stores a literal "—") threw straight out of this method and
    // 500'd the caller, leaving no WhatsAppMessage row to explain why nothing
    // was sent. Every other failure mode below records itself; this one must
    // too, or it is the single blind spot in the log.
    let destination: string;
    try {
      destination = this.normalise(input.destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid destination";
      this.logger.error(`${input.campaignName} not sent: ${message}`);
      return this.prisma.whatsAppMessage.create({
        data: {
          kind: input.kind,
          campaignName: input.campaignName,
          // Stored raw: the whole point of this row is to show what the
          // caller actually handed us.
          destination: input.destination,
          templateParams: input.templateParams ?? [],
          mediaUrl: input.media?.url,
          relatedType: input.relatedType,
          relatedId: input.relatedId,
          sentById: input.sentById,
          status: WhatsAppMessageStatus.FAILED,
          errorMessage: message,
          attempts: 1,
        },
      });
    }

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
      this.logger.log(`[WhatsApp disabled] ${input.campaignName} -> ${destination}`);
      return record;
    }

    const body = {
      apiKey: this.config.get<string>("AISENSY_API_KEY"),
      campaignName: input.campaignName,
      destination,
      // AiSensy's `userName` is the RECIPIENT's contact name — it creates or
      // updates the contact record under this name. Passing our own business
      // name here (the intuitive reading) labels every contact in the AiSensy
      // CRM as the business itself.
      userName:
        input.recipientName ?? this.config.get<string>("AISENSY_SENDER_NAME") ?? "Customer",
      templateParams: (input.templateParams ?? []).map(String),
      source: "erp-portal",
      ...(input.copyCode ? { buttons: buildCopyCodeButton(input.copyCode) } : {}),
      ...(input.media ? { media: input.media } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
    };

    // Logged without the API key: the exact payload is the only way to tell a
    // rejected-by-Meta message from a malformed one, since AiSensy answers 200
    // either way and its verdict never comes back through this response.
    const { apiKey: _omitted, ...loggable } = body;
    this.logger.debug(`AiSensy request: ${JSON.stringify(loggable)}`);

    try {
      const res = await fetch(
        this.config.get<string>("AISENSY_API_URL") ?? DEFAULT_AISENSY_API_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        },
      );

      // AiSensy returns { success: "true", submitted_message_id: "..." } —
      // note `success` is the *string* "true", not a boolean, and the id field
      // is snake_case. Don't switch either to the shapes you'd expect.
      const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      // A 2xx alone does not mean accepted: AiSensy also answers 200 with
      // success:"false" and a reason in `message`. Treating that as SENT
      // would silently discard the only explanation we ever get for a
      // message that vanishes without reaching WhatsApp.
      // `success` is compared against both forms rather than stringified:
      // the field is untyped JSON, and String() on an unexpected object would
      // yield "[object Object]" and silently read as "not accepted".
      const accepted =
        res.ok &&
        (payload.success === undefined ||
          payload.success === "true" ||
          payload.success === true);

      if (!accepted) {
        const message =
          typeof payload.message === "string" ? payload.message : `HTTP ${res.status}`;
        this.logger.error(
          `AiSensy send failed (${input.campaignName} -> ${destination}): ${message} ` +
            `| raw=${JSON.stringify(payload)}`,
        );
        return this.prisma.whatsAppMessage.update({
          where: { id: record.id },
          data: {
            status: WhatsAppMessageStatus.FAILED,
            errorMessage: message,
            attempts: { increment: 1 },
          },
        });
      }

      return this.prisma.whatsAppMessage.update({
        where: { id: record.id },
        data: {
          status: WhatsAppMessageStatus.SENT,
          providerId:
            typeof payload.submitted_message_id === "string" ? payload.submitted_message_id : null,
          attempts: { increment: 1 },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown transport error";
      this.logger.error(`AiSensy transport error: ${message}`);
      return this.prisma.whatsAppMessage.update({
        where: { id: record.id },
        data: {
          status: WhatsAppMessageStatus.FAILED,
          errorMessage: message,
          attempts: { increment: 1 },
        },
      });
    }
  }
}
