import React from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { C, F, card } from "./tokens";
import { PurchaseOrder } from "@/features/purchasing";
import { Button } from "../../../../shared/ui/primitives";

interface GRNSuccessProps {
  grnBatchId: string;
  onPrint: () => void;
  onReset: () => void;
}

export function GRNSuccessView({ grnBatchId, onPrint, onReset }: GRNSuccessProps) {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 40 }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckCircle2 size={32} color={C.green} />
      </div>
      <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center" }}>GRN Created Successfully</div>
      <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 600, color: C.burg }}>{grnBatchId}</div>
      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
        Barcodes are being generated — tap below to print labels
      </div>
      <Button variant="primary" fullWidth iconLeft={Printer} onClick={onPrint} className="rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D]">
        Print Barcode Labels
      </Button>
      <Button variant="secondary" fullWidth onClick={onReset} className="mt-0.5 rounded-full border-[rgba(110,15,45,0.30)] text-[#6E0F2D]">
        Back to GRN
      </Button>
    </div>
  );
}

interface GRNPrintProps {
  selectedPO: PurchaseOrder | null;
  receivedQty: Record<number, string>;
  receivedUnit: Record<number, "kg" | "g" | "Reels" | "Buns">;
  grnBatchId: string;
  onReset: () => void;
}

export function GRNPrintView({ selectedPO, receivedQty, receivedUnit, grnBatchId, onReset }: GRNPrintProps) {
  const batches = (selectedPO?.materials ?? []).map((m, i) => {
    const qtyText = `${receivedQty[i] || 0} ${receivedUnit[i] || m.unit}`;
    return {
      id: `BATCH-${selectedPO?.id.split("-").pop()}-00${i + 1}`,
      type: m.materialType,
      qty: qtyText,
    };
  });

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: "14px 20px 0", fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>Barcode Labels</div>
      <div style={{ padding: "4px 20px 12px", fontFamily: F.u, fontSize: 13, color: C.muted }}>Print labels for all batches in {grnBatchId}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px 16px" }}>
        {batches.map((b) => (
          <div key={b.id} style={{ ...card, padding: 14 }}>
            <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg, marginBottom: 2 }}>{b.id}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10 }}>{b.type} · {b.qty}</div>
            <div style={{ background: "#000", height: 32, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: F.m, fontSize: 6, color: "#FFF", letterSpacing: 2 }}>||| | || ||| ||</span>
            </div>
            <Button variant="secondary" fullWidth size="sm" iconLeft={Printer} className="rounded-[7px] border-[rgba(110,15,45,0.12)] bg-[#FFF8E7] text-[#6E0F2D] hover:bg-[#FFF8E7]">
              Print
            </Button>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        <Button variant="primary" fullWidth iconLeft={Printer} className="rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D] mb-2.5">Print All Labels</Button>
        <Button variant="secondary" fullWidth onClick={onReset} className="rounded-full border-[rgba(110,15,45,0.30)] text-[#6E0F2D]">Done — Skip Printing</Button>
      </div>
    </div>
  );
}
