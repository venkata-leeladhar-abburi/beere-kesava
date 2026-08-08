import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Truck, X, Upload, CheckCircle2 } from "lucide-react";
import { DispatchRecord } from "../../../finishing/contexts/FinishingContext";
import { T, F } from "../theme";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { TransportData } from "../types";
import { TransportForm } from "./shared/TransportForm";
import { Modal } from "../../../../shared/ui/overlay";

// ── Resume (complete pending) dispatch modal ──────────────────────────────────
// Exported so the Worker Staff portal can complete dispatch details with the
// exact same form, rather than a copy that would drift.
export function ResumeDispatchModal({ record, onSave, onClose }: {
  record: DispatchRecord;
  onSave: (patch: Partial<DispatchRecord>) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [transport, setTransport] = useState<TransportData>({
    lrNumber: record.lrNumber || "", transportCompany: record.transportCompany || "", vehicleNumber: record.vehicleNumber || "",
    driverName: record.driverName || "", dispatchDate: record.dispatchDate || today, notes: record.notes || "",
    expectedDelivery: record.expectedDelivery || "", specialInstructions: record.specialInstructions || "",
  });

  const canSave = transport.lrNumber.trim() && transport.transportCompany.trim() && transport.vehicleNumber.trim() && transport.dispatchDate;

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="md">
        <div style={{ background: T.deepWine, padding: "20px 28px 16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Truck size={20} color={T.antiqueGold} />
            <Dialog.Title asChild>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Complete Dispatch Details</span>
            </Dialog.Title>
          </div>
          <Dialog.Close asChild>
            <IconButton
              icon={X}
              label="Close"
              size="sm"
              className="bg-white/12 text-white hover:bg-white/20 active:bg-white/25"
            />
          </Dialog.Close>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>
            {record.type === "wholesale" ? `Wholesale dispatch to ${record.customerName ?? "customer"}` : "Shop dispatch"} · {record.sareeIds.length} saree{record.sareeIds.length > 1 ? "s" : ""} · Invoice {record.invoiceNumber || "—"}
          </div>
          <TransportForm data={transport} onChange={setTransport} wholesale={record.type === "wholesale"} />
          {record.pendingReceipt && (
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Upload Receipt</div>
              <div style={{ border: `2px dashed rgba(110,15,45,0.20)`, borderRadius: 14, padding: "28px 24px", textAlign: "center" as const, cursor: "pointer", background: T.silkCream }}>
                <Upload size={28} color={T.taupe} style={{ margin: "0 auto 10px" }} />
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 4 }}>Click to upload LR receipt</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>JPG, PNG or PDF — max 10 MB</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 28px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexShrink: 0 }}>
          <Button onClick={onClose} variant="secondary" size="lg" className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={() => onSave({ ...transport, pendingTransport: false, pendingReceipt: false })}
            disabled={!canSave}
            variant="primary"
            size="lg"
            iconLeft={CheckCircle2}
            fullWidth
            className="rounded-full bg-[linear-gradient(135deg,var(--bk-burgundy-900)_0%,var(--bk-burgundy-950)_100%)]"
          >
            Save Details
          </Button>
        </div>
    </Modal>
  );
}
