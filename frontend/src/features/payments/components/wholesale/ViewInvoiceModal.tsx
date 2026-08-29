import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { useFinishing } from "@/features/finishing";
import type { BulkOrder } from "@/features/production";
import { Invoice } from "../../types";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DocumentViewer, InvoiceDocument, DEFAULT_LETTERHEAD_FIRM, type InvoiceLineItem } from "../../../../shared/ui/document";
import { toPaise, hsnRate, DEFAULT_SAREE_HSN } from "../../../../lib/gst";

// ── View Invoice Modal ────────────────────────────────────────────────────────
// Renders the real InvoiceDocument (design-system/07-DOCUMENTS.md Part H.1)
// inside the shared DocumentViewer, so Print/Download produce the exact same
// tree — via the print-isolated #document-print-root, not the modal chrome.
export function ViewInvoiceModal({ inv, bulkOrderData, onClose }: { inv: Invoice; bulkOrderData?: BulkOrder; onClose: () => void }) {
  const { dispatches, isError: dispatchesError } = useFinishing();
  // Matched by the real dispatch FK, not a string comparison against
  // inv.id — dispatch.invoiceNumber holds the human invoice code
  // ("INV-Sree-2-001"), so comparing it to inv.id (the UUID) never matched
  // and this modal silently lost the dispatch's sarees, phone, GST and
  // transport details on every invoice.
  const dispatch = dispatches.find(d => d.id === inv.dispatchId);
  // Whoever recorded the most recent payment — the one that matters most
  // once the invoice is paid or partially paid. Not shown on the printed
  // tax invoice itself (a customer-facing document has no business naming
  // internal staff); shown in the modal chrome instead.
  // Backend returns payments newest-first (orderBy date desc) — see
  // invoices.service.ts's `include`.
  const lastPayment = inv.payments?.[0];
  const recordedByLabel = lastPayment?.recordedBy
    ? `${lastPayment.recordedBy.firstName} ${lastPayment.recordedBy.lastName}`.trim()
    : null;

  // The printed invoice must always foot to inv.total — the amount actually
  // recorded and reconciled against on the card/ledger — never to
  // dispatch.pricePerSaree, which can go stale after a manual total edit or
  // late price change and silently diverge from what's owed. GST here is
  // applied on top of the line items below, so when it's on, inv.total (the
  // real, tax-inclusive invoiced amount) has to be backed down to a taxable
  // base first or the document would foot higher than what's owed.
  const applyGst = !!dispatch?.gstPct;
  const numSarees = dispatch?.sareeIds?.length || bulkOrderData?.total || 1;
  const taxableTotal = applyGst ? inv.total / (1 + hsnRate(DEFAULT_SAREE_HSN) / 100) : inv.total;
  const pricePerSaree = Math.round(taxableTotal / numSarees);

  const items: InvoiceLineItem[] = dispatch?.sareeIds?.length
    ? dispatch.sareeIds.map((sid, i) => ({
        id: sid,
        description: `${bulkOrderData?.design || "Design"} · ${bulkOrderData?.sareeType || "Type"}`,
        batchLabel: bulkOrderData?.batches?.[0],
        // Last row absorbs the rounding remainder so the line items always
        // foot to exactly taxableTotal, not a few paise short/over.
        ratePaise: i === dispatch.sareeIds.length - 1
          ? toPaise(taxableTotal) - toPaise(pricePerSaree) * (dispatch.sareeIds.length - 1)
          : toPaise(pricePerSaree),
      }))
    : [{
        id: bulkOrderData ? "Bulk Order Production" : inv.code,
        description: bulkOrderData ? `${bulkOrderData.design || "Design"} · ${bulkOrderData.sareeType || "Sarees"}` : "Invoice",
        ratePaise: toPaise(taxableTotal),
      }];

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xl">
      <div style={{ display: "flex", flexDirection: "column", height: "85vh", overflow: "hidden", borderRadius: "1rem", background: "#FFFDF9" }}>
        {/* Royal Burgundy Banner */}
        <div style={{
          background: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: 16,
        }}>
          <div>
            <Dialog.Title style={{ fontFamily: "var(--font-display, serif)", fontSize: 20, fontWeight: 700, color: "#FFFDF9", margin: 0 }}>
              Tax Invoice — {inv.code}
            </Dialog.Title>
            <Dialog.Description style={{ fontFamily: "var(--font-ui, sans-serif)", fontSize: 13, color: "rgba(255,253,249,0.85)", marginTop: 4, margin: 0 }}>
              {inv.customer} {recordedByLabel ? `· Payment recorded by ${recordedByLabel}` : "· Official Tax Invoice"}
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose}
              className="rounded-[8px] bg-[rgba(255,255,255,0.14)] text-[#FFFDF9] hover:bg-[rgba(255,255,255,0.25)]" />
          </Dialog.Close>
        </div>

        {dispatchesError && (
          <div style={{ margin: "12px 20px 0", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#C0392B", fontWeight: 600 }}>
            Failed to load dispatch details — some fields below may be showing fallback values.
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <DocumentViewer fileName={inv.code} documentTitle={`Tax Invoice ${inv.code}`}>
            <InvoiceDocument
              invoiceNumber={inv.code}
              invoiceDate={inv.invoiceDate}
              dueDate={inv.dueDate}
              firm={DEFAULT_LETTERHEAD_FIRM}
              customer={{
                name: inv.customer,
                address: inv.city || undefined,
                phone: dispatch?.customerPhone,
              }}
              items={items}
              applyGst={applyGst}
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
      </div>
    </Modal>
  );
}
