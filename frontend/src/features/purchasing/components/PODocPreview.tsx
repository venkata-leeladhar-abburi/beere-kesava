/**
 * PODocPreview — the live preview panel on the PO create screen.
 * ═══════════════════════════════════════════════════════════════════════════
 * This used to be a hand-rolled facsimile of a purchase order: a centred
 * "🪷 Beere Kesava & Brothers Silks / Est. 1999 / Guntur, Andhra Pradesh"
 * strip, a four-column CSS-grid table and an underscore signature block. It
 * was a SECOND implementation of the PO document, so when the real
 * PurchaseOrderDocument (07-DOCUMENTS Part H.3) landed with the brand
 * letterhead band, the party/meta cards and the proper line-item table,
 * this panel silently kept showing the old design — the "purchase order
 * document is not the updated one" report.
 *
 * It is now a thin adapter: the panel renders the REAL document, scaled to
 * fit, so the preview is guaranteed to match what gets printed, downloaded
 * and sent to the vendor.
 */
import React from "react";
import { ExtItem } from "./POTypesAndVendors";
import { DocumentThumb, PurchaseOrderDocument, DEFAULT_LETTERHEAD_FIRM } from "../../../shared/ui/document";

interface PODocPreviewProps {
  vendor: string;
  vendorCity: string;
  vendorContact?: string;
  firmName?: string;
  deliveryDate: string;
  materials: ExtItem[];
  poNumber: string;
  notesVendor?: string;
  urgency: string;
  today: string;
  /** Who is raising the PO — shown against "Prepared by". */
  raisedBy?: string;
}

export function PODocPreview({
  vendor,
  vendorCity,
  vendorContact,
  firmName,
  deliveryDate,
  materials,
  poNumber,
  notesVendor,
  urgency,
  today,
  raisedBy = "Admin",
}: PODocPreviewProps) {
  const totalValue = materials.reduce(
    (sum, m) => sum + (m.subtotal || (m.pricePerUnit || 0) * (m.quantity || 0)),
    0
  );

  return (
    <DocumentThumb>
      <PurchaseOrderDocument
        poNumber={poNumber || "PO-—"}
        submittedDate={today}
        deliveryDate={deliveryDate || undefined}
        // The firm dropdown on the form picks WHICH of the group's firms is
        // buying, so it overrides the letterhead name — the rest of the
        // letterhead (tagline, address) stays the shared brand identity.
        firm={firmName ? { ...DEFAULT_LETTERHEAD_FIRM, name: firmName } : DEFAULT_LETTERHEAD_FIRM}
        supplier={{ name: vendor || "—", city: vendorCity, contact: vendorContact }}
        materials={materials}
        totalValue={totalValue}
        urgency={urgency === "Urgent" ? "Urgent" : "Normal"}
        notesVendor={notesVendor || undefined}
        raisedBy={raisedBy}
      />
    </DocumentThumb>
  );
}
