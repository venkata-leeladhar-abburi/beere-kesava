import { apiClient } from "./client";

export interface WhatsAppMessage {
  id: string;
  kind: string;
  campaignName: string;
  destination: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
}

export const whatsappApi = {
  // PODocumentModal's "Share with Vendor" — posts the just-rasterised PO PDF
  // (see exportDocumentPdfBlob) alongside the PO id; the backend resolves the
  // vendor's phone from the PO's own vendor relation, never from the client.
  sendPoDocument: (poId: string, pdf: Blob) => {
    const form = new FormData();
    form.append("poId", poId);
    form.append("file", pdf, `${poId}.pdf`);
    return apiClient.postForm<WhatsAppMessage>("/whatsapp/send-po-document", form);
  },

  // "Send to Customer on WhatsApp" on the sale success screen. One counter
  // bill is several SaleRecords — one per saree — so every ref goes up
  // together and the backend produces a single message from them, not one
  // per piece. Amounts, customer and staff are all re-read server-side from
  // those records; only the PDF comes from here.
  sendSaleBill: (saleRefs: string[], pdf: Blob, billRef: string) => {
    const form = new FormData();
    form.append("saleRefs", JSON.stringify(saleRefs));
    form.append("file", pdf, `${billRef}.pdf`);
    return apiClient.postForm<SendSaleBillResult>("/whatsapp/send-sale-bill", form);
  },
};

export interface SendSaleBillResult {
  billRef: string;
  mediaUrl: string;
  /** null when the customer has no phone number on file. */
  customer: WhatsAppMessage | null;
  /** One per number on ADMIN_WHATSAPP_NUMBERS. */
  admins: WhatsAppMessage[];
}
