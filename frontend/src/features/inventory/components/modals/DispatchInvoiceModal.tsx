import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { DispatchRecord, useFinishing } from "../../../finishing/contexts/FinishingContext";
import { useFirms } from "../../../firms/contexts/FirmsContext";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";
import { DocumentViewer, InvoiceDocument, DEFAULT_LETTERHEAD_FIRM, type InvoiceLineItem } from "../../../../shared/ui/document";
import { toPaise } from "../../../../lib/gst";

// ── Dispatch invoice viewer ─────────────────────────────────────────────────
// Renders the real InvoiceDocument for a dispatch record's own invoice —
// the "View Invoice" action on Dispatch History previously just alerted
// "coming soon". Print/Download come from DocumentViewer, same as every
// other document in the app.
export function DispatchInvoiceModal({ dispatch, onClose }: { dispatch: DispatchRecord; onClose: () => void }) {
  const { returns } = useFinishing();
  const { firms } = useFirms();

  const firm = firms.find(f => f.id === dispatch.firmId);
  const pricePerSaree = dispatch.pricePerSaree ?? Math.round((dispatch.totalAmount ?? 0) / (dispatch.sareeIds.length || 1));

  const items: InvoiceLineItem[] = dispatch.sareeIds.map(sareeId => {
    const r = returns.find(ret => ret.sareeId === sareeId);
    return {
      id: sareeId,
      description: r ? `${r.designCode} · ${r.sareeType}` : "Saree",
      batchLabel: dispatch.bulkOrderRef,
      ratePaise: toPaise(pricePerSaree),
    };
  });

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xl">
      <div style={{ display: "flex", flexDirection: "column", height: "85vh" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 8px 0", flexShrink: 0 }}>
          <Dialog.Title className="sr-only">Invoice {dispatch.invoiceNumber || dispatch.id}</Dialog.Title>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" variant="ghost" size="sm" />
          </Dialog.Close>
        </div>
        <DocumentViewer>
          <InvoiceDocument
            invoiceNumber={dispatch.invoiceNumber || dispatch.id}
            invoiceDate={dispatch.invoiceDate || dispatch.dispatchDate}
            dueDate={dispatch.paymentDueDate}
            firm={firm ? { name: firm.firmName, address: firm.address, gstin: firm.gstNumber } : DEFAULT_LETTERHEAD_FIRM}
            customer={{
              name: dispatch.customerName ?? "—",
              phone: dispatch.customerPhone,
            }}
            items={items}
            applyGst={!!dispatch.gstPct}
            bulkOrderRef={dispatch.bulkOrderRef}
            dispatch={{
              lrNumber: dispatch.lrNumber,
              transportCompany: dispatch.transportCompany,
              vehicleNumber: dispatch.vehicleNumber,
              dispatchDate: dispatch.dispatchDate,
            }}
            notes={dispatch.specialInstructions || dispatch.invoiceNotes}
          />
        </DocumentViewer>
      </div>
    </Modal>
  );
}
