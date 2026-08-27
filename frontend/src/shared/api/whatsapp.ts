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
};
