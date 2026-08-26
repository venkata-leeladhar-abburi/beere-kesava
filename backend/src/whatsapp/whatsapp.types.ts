import { WhatsAppMessageKind } from "../generated/prisma/client";

export interface SendTemplateInput {
  campaignName: string;
  // Raw phone number as stored in the DB (10-digit local or already E.164) —
  // normalised inside WhatsAppService before it ever reaches AiSensy.
  destination: string;
  // The recipient's name, sent to AiSensy as `userName` so the contact it
  // creates is labelled correctly. Falls back to AISENSY_SENDER_NAME.
  recipientName?: string;
  templateParams?: string[];
  /**
   * For AUTHENTICATION templates carrying a copy-code button. Meta requires
   * the code in BOTH the body params and the button component — sending only
   * the body param gets the message accepted by AiSensy and then rejected by
   * Meta with "required parameter is missing", which surfaces nowhere in the
   * API response. Set this to the same value as the body's code param.
   */
  copyCode?: string;
  media?: { url: string; filename: string };
  kind: WhatsAppMessageKind;
  relatedType?: string;
  relatedId?: string;
  sentById?: string;
  tags?: string[];
}
