import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";

import { DispatchRecord } from "@/features/finishing";
import { useFirms } from "@/features/firms";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import {
  DocumentViewer,
  DeliveryChallanDocument,
  DEFAULT_LETTERHEAD_FIRM,
  type ChallanLineItem,
} from "../../../../shared/ui/document";
import { inventoryApi } from "../../../../shared/api/inventory";
import { toPaise } from "../../../../lib/gst";
import { challanReference, documentDate } from "./dispatchDocument";

/** Silk sarees — the HSN every line on a saree document carries. */
const SAREE_HSN = "5007";

/**
 * The document for a dispatch to our own shop.
 *
 * Deliberately NOT a tax invoice: no sale happens when stock moves to the
 * showroom, so there is no customer to bill, no GST, and no amount payable.
 * Rendering the invoice template here produced a "TAX INVOICE" with a raw UUID
 * as its number, "Bill To —", and ₹0.00 on every line.
 *
 * A Delivery Challan is the correct instrument for goods movement without a
 * sale (design-system/07-DOCUMENTS.md Part H.4): it carries the pieces, the
 * transport, a value marked "for transport purposes only", the not-a-tax-invoice
 * disclaimer, and a receiver acknowledgement block for the shop to sign.
 */
export function DispatchChallanModal({ dispatch, onClose }: { dispatch: DispatchRecord; onClose: () => void }) {
  const { firms } = useFirms();

  // Shop stock carries the full detail for exactly these sarees — design, saree
  // type, weaver/loom and the retail price — keyed by the dispatch that
  // delivered them. Sold pieces stay in this list, so a reprinted challan still
  // shows every line it was originally sent with.
  // Scoped server-side to this dispatch. It used to fetch the shop's entire
  // stock and filter it down here, so a printed challan got slower with every
  // saree the shop had ever received.
  const { data: shopStock } = useQuery({
    queryKey: ["shop-stock", dispatch.id],
    queryFn: () => inventoryApi.shopStock(dispatch.id),
  });

  const detailBySaree = new Map((shopStock ?? []).map(s => [s.sareeId, s]));

  const reference = challanReference(dispatch);
  const firm = firms.find(f => f.id === dispatch.firmId);

  const items: ChallanLineItem[] = dispatch.sareeIds.map(sareeId => {
    const d = detailBySaree.get(sareeId);
    const descriptionParts = [d?.sareeTypeLabel ?? d?.sareeTypeCode, d?.designCode, d?.weaverName ?? (d?.loomNumber ? `Loom ${d.loomNumber}` : null)]
      .filter(Boolean);
    return {
      id: sareeId,
      description: descriptionParts.length > 0 ? descriptionParts.join(" · ") : "Saree",
      hsn: SAREE_HSN,
      qty: 1,
      unit: "pc",
      // Retail price stands in as the declared transport value. It is never
      // billed — the challan and its footer both say so.
      transportValuePaise: toPaise(d?.retailPrice ?? 0),
    };
  });

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xl">
      <div style={{ display: "flex", flexDirection: "column", height: "85vh" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 8px 0", flexShrink: 0 }}>
          <Dialog.Title className="sr-only">Delivery Challan {reference}</Dialog.Title>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" />
          </Dialog.Close>
        </div>
        <DocumentViewer fileName={reference} documentTitle={`Delivery Challan ${reference}`}>
          <DeliveryChallanDocument
            challanNumber={reference}
            challanDate={documentDate(dispatch.dispatchDate)}
            firm={firm ? { name: firm.firmName, address: firm.address, gstin: firm.gstNumber } : DEFAULT_LETTERHEAD_FIRM}
            party={{ label: "Deliver To", name: "Shop / Showroom", address: dispatch.notes ?? undefined }}
            items={items}
            reason="Stock transfer to shop"
            vehicleNumber={dispatch.vehicleNumber || undefined}
            lrNumber={dispatch.lrNumber || undefined}
          />
        </DocumentViewer>
      </div>
    </Modal>
  );
}
