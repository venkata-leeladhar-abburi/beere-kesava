import React from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { C, F, card, btnPrimary, btnGhost } from "./tokens";
import { PurchaseOrder } from "../../../purchasing/contexts/POContext";

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
      <button onClick={onPrint} style={{ ...btnPrimary, gap: 8 }}>
        <Printer size={16} /> Print Barcode Labels
      </button>
      <button onClick={onReset} style={{ ...btnGhost, marginTop: 2 }}>
        Back to GRN
      </button>
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
        {batches.map((b, i) => (
          <div key={i} style={{ ...card, padding: 14 }}>
            <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg, marginBottom: 2 }}>{b.id}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10 }}>{b.type} · {b.qty}</div>
            <div style={{ background: "#000", height: 32, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: F.m, fontSize: 6, color: "#FFF", letterSpacing: 2 }}>||| | || ||| ||</span>
            </div>
            <button style={{ width: "100%", background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 7, padding: "5px 0", fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Printer size={11} /> Print
            </button>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        <button style={{ ...btnPrimary, gap: 8, marginBottom: 10 }}><Printer size={16} /> Print All Labels</button>
        <button onClick={onReset} style={{ ...btnGhost }}>Done — Skip Printing</button>
      </div>
    </div>
  );
}
