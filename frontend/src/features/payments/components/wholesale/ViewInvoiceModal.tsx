import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { useFinishing } from "../../../finishing/contexts/FinishingContext";
import { BulkOrder } from "../../theme";
import { Invoice } from "../../types";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DocumentViewer, InvoiceDocument, DEFAULT_LETTERHEAD_FIRM, type InvoiceLineItem } from "../../../../shared/ui/document";
import { toPaise } from "../../../../lib/gst";

// ── View Invoice Modal ────────────────────────────────────────────────────────
// Renders the real InvoiceDocument (design-system/07-DOCUMENTS.md Part H.1)
// inside the shared DocumentViewer, so Print/Download produce the exact same
// tree — via the print-isolated #document-print-root, not the modal chrome.
export function ViewInvoiceModal({ inv, bulkOrderData, onClose }: { inv: Invoice; bulkOrderData?: BulkOrder; onClose: () => void }) {
  const { dispatches, isError: dispatchesError } = useFinishing();
  const dispatch = dispatches.find(d => d.invoiceNumber === inv.id);

  // Try to determine the price per saree to display in the list.
  // If not available, we just split the total amount evenly.
  const numSarees = dispatch?.sareeIds?.length || bulkOrderData?.total || 1;
  const pricePerSaree = dispatch?.pricePerSaree || Math.round(inv.total / numSarees);

  const items: InvoiceLineItem[] = dispatch?.sareeIds?.length
    ? dispatch.sareeIds.map(sid => ({
        id: sid,
        description: `${bulkOrderData?.design || "Design"} · ${bulkOrderData?.sareeType || "Type"}`,
        batchLabel: bulkOrderData?.batches?.[0],
        ratePaise: toPaise(pricePerSaree),
      }))
    : [{
        id: bulkOrderData ? "Bulk Order Production" : inv.id,
        description: bulkOrderData ? `${bulkOrderData.design || "Design"} · ${bulkOrderData.sareeType || "Sarees"}` : "Invoice",
        ratePaise: toPaise(inv.total),
      }];

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xl">
      <div style={{ display: "flex", flexDirection: "column", height: "85vh" }}>
        {/* Slim close bar — the document's own Letterhead carries the title */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 8px 0", flexShrink: 0 }}>
          <Dialog.Title className="sr-only">Invoice {inv.id}</Dialog.Title>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" />
          </Dialog.Close>
        </div>
        {dispatchesError && (
          <div style={{ margin: "0 16px", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#C0392B", fontWeight: 600 }}>
            Failed to load dispatch details — some fields below may be showing fallback values.
          </div>
        )}
        <DocumentViewer>
          <InvoiceDocument
            invoiceNumber={inv.id}
            invoiceDate={inv.invoiceDate}
            dueDate={inv.dueDate}
            firm={DEFAULT_LETTERHEAD_FIRM}
            customer={{
              name: inv.customer,
              address: inv.city || undefined,
              phone: dispatch?.customerPhone,
            }}
            items={items}
            applyGst={!!dispatch?.gstPct}
            bulkOrderRef={bulkOrderData?.ref}
            dispatch={dispatch ? {
              lrNumber: dispatch.lrNumber,
              transportCompany: dispatch.transportCompany,
              vehicleNumber: dispatch.vehicleNumber,
              dispatchDate: dispatch.dispatchDate,
            } : undefined}
            statusLabel={inv.status === "Paid" ? "PAID" : inv.status === "Partial" ? "PARTIALLY PAID" : undefined}
          />
        </DocumentViewer>
      </div>
    </Modal>
  );
}
