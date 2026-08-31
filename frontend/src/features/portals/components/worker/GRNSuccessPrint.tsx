import { CheckCircle2, Printer } from "lucide-react";
import { C, F, card } from "./tokens";
import { GrnReceiptItem } from "../../../../shared/api/rawMaterials";
import { Button } from "../../../../shared/ui/primitives";
import { jariToReels, formatBunsReels } from "../../../../shared/lib/weightUnits";
import { useDocument } from "../../../../shared/ui/document";
import { ScannableCode } from "../../../../shared/ui/domain";
import { GrnLabelSheet, type GrnLabel } from "./GrnLabelSheet";

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
      <Button variant="primary" fullWidth iconLeft={Printer} onClick={onPrint} className="rounded-[14px] bg-[#6E0F2D] hover:bg-[#6E0F2D]">
        Print GRN Label
      </Button>
      <Button variant="secondary" fullWidth onClick={onReset} className="mt-0.5 rounded-[14px] border-[rgba(110,15,45,0.30)] text-[#6E0F2D]">
        Back to GRN
      </Button>
    </div>
  );
}

interface GRNPrintProps {
  /** The just-created (or, from history, a previously-created) GRN receipt — its items carry the real, persisted itemCode/description that print on the label. */
  grn: GrnReceiptItem | null;
  grnBatchId: string;
  /** Omit when rendering read-only from history (no form step to return to). */
  onReset?: () => void;
}

export function GRNPrintView({ grn, grnBatchId, onReset }: GRNPrintProps) {
  const { print } = useDocument();

  const batches: GrnLabel[] = (grn?.items ?? []).map((item, i) => {
    const isJari = item.materialType === "JARI";
    // Jari is received in Buns but stocked, issued and listed in Goods Receipt
    // History as Reels (4 Buns = 1 Reel). The label printed the raw received
    // unit, so a tag read "1000 Buns" against a "250 Reels" row for the very
    // same drum. Normalise here so the physical label matches every screen.
    const qtyText = isJari
      ? formatBunsReels(jariToReels(item.quantity, item.unit ?? "KG"))
      : `${item.quantity} ${item.unit || "kg"}`;
    return {
      // Falls back to a position-derived id only for rows received before
      // itemCode existed — every new receipt gets the real persisted one.
      code: item.itemCode || `${grnBatchId}-${i + 1}`,
      materialType: item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari",
      description: item.description || item.name,
      quantity: qtyText,
      grnBatchId,
      vendor: grn?.supplierName,
      receivedDate: grn?.receivedDate
        ? new Date(grn.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : undefined,
    };
  });

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: "14px 20px 0", fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>Barcode Labels</div>
      <div style={{ padding: "4px 20px 12px", fontFamily: F.u, fontSize: 13, color: C.muted }}>Print labels for all batches in {grnBatchId}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px 16px" }}>
        {batches.map((b) => (
          <div key={b.code} style={{ ...card, padding: 14 }}>
            <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg, marginBottom: 2 }}>{b.code}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 2 }}>{b.materialType} · {b.quantity}</div>
            {b.description && <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted, marginBottom: 8 }}>{b.description}</div>}
            {/* The same code that prints, so what's on screen is what the
                scanner will read off the tag. */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, marginTop: b.description ? 0 : 8 }}>
              <ScannableCode value={b.code} size={72} />
            </div>
            <Button variant="secondary" fullWidth size="sm" iconLeft={Printer} onClick={() => print(<GrnLabelSheet labels={[b]} />)} className="rounded-[7px] border-[rgba(110,15,45,0.12)] bg-[#FFF8E7] text-[#6E0F2D] hover:bg-[#FFF8E7]">
              Print
            </Button>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 20px" }}>
        <Button variant="primary" fullWidth iconLeft={Printer} disabled={batches.length === 0} onClick={() => print(<GrnLabelSheet labels={batches} />)} className="rounded-[14px] bg-[#6E0F2D] hover:bg-[#6E0F2D] mb-2.5">Print All Labels</Button>
        {onReset && <Button variant="secondary" fullWidth onClick={onReset} className="rounded-[14px] border-[rgba(110,15,45,0.30)] text-[#6E0F2D]">Done — Skip Printing</Button>}
      </div>
    </div>
  );
}
