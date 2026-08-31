import { ChevronLeft, Flower2, Printer } from "lucide-react";
import { C, F, Btn, Chip } from "./theme";
import { IconButton } from "../../../../shared/ui/primitives";
import { useDocument } from "../../../../shared/ui/document";
import type { SaleLine } from "./sale-cart";

interface NewSaleBillModalProps {
  lines: SaleLine[];
  custName: string;
  phone: string;
  payment: "cash" | "upi" | "card" | "other" | null;
  total: number;
  /** The bill's own reference — empty while previewing a sale not yet recorded. */
  billRef?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  fmtPrice: (n: number) => string;
  onClose: () => void;
}

function BillReceipt({ lines, custName, phone, payment, total, billRef, fmtPrice }: Omit<NewSaleBillModalProps, "isMobile" | "isTablet" | "onClose">) {
  return (
    <div style={{ background: C.white, overflow: "hidden" }}>
      <div style={{ background: C.burg, padding: "18px 20px", textAlign: "center" as const }}>
        <Flower2 size={24} color="rgba(255,255,255,0.7)" style={{ margin: "0 auto 6px" }} />
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Beere Kesava & Brothers Silks</div>
        <div style={{ fontFamily: F.m, fontSize: 12, color: C.gold, marginTop: 2 }}>Est. 1999</div>
        <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.70)", marginTop: 4 }}>Main Street, Silk Market, Bangalore — 560001</div>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>Bill No: {billRef || "—"}</span>
          <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>
            {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginBottom: 12 }}>
          {[["Customer", custName || "—"], ["Phone", phone ? `+91 ${phone}` : "—"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
              <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        {/* Itemised lines — one row per saree on the bill. */}
        <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: F.m, fontSize: 11, letterSpacing: 1.2, color: C.muted, textTransform: "uppercase" as const }}>Item</span>
            <span style={{ fontFamily: F.m, fontSize: 11, letterSpacing: 1.2, color: C.muted, textTransform: "uppercase" as const }}>Amount</span>
          </div>
          {lines.map(l => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg, fontWeight: 600 }}>{l.id}</span>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
                  {" "}· {l.name}{l.design && l.design !== "—" ? ` · ${l.design}` : ""}
                </span>
              </span>
              <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, fontWeight: 500, flexShrink: 0 }}>{fmtPrice(l.soldPrice)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Total Amount ({lines.length} saree{lines.length !== 1 ? "s" : ""}):</span>
          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.gold }}>{fmtPrice(total)}</span>
        </div>
        <div style={{ textAlign: "center" as const, marginBottom: 8 }}>
          <Chip label={`Payment: ${payment === "upi" ? "UPI" : payment === "card" ? "Card" : payment === "cash" ? "Cash" : "Other"}`} color={C.burg} bg="rgba(110,15,45,0.08)" />
        </div>
        <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 14, textAlign: "center" as const }}>
          <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 13, color: C.burg }}>Thank you for shopping with Beere Kesava & Brothers Silks</div>
          <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 2, color: C.gold, marginTop: 4, textTransform: "uppercase" as const }}>Tradition · Trust · Timeless Quality</div>
        </div>
      </div>
    </div>
  );
}

export function NewSaleBillModal({
  lines,
  custName,
  phone,
  payment,
  total,
  billRef,
  isMobile,
  isTablet: _isTablet,
  fmtPrice,
  onClose,
}: NewSaleBillModalProps) {
  const { print } = useDocument();
  const receiptProps = { lines, custName, phone, payment, total, billRef, fmtPrice };

  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ background: C.burg, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <IconButton icon={ChevronLeft} label="Back" variant="ghost" onClick={onClose} className="text-white" />
        <span style={{ fontFamily: F.d, fontWeight: 600, fontSize: 18, color: "#FFF" }}>Bill Preview</span>
      </div>
      <div
        className={isMobile ? "mx-5 my-4" : "mx-auto my-6 w-full max-w-[480px]"}
        style={{
          borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 2px 12px rgba(44,24,16,0.07)", overflow: "hidden",
        }}
      >
        <BillReceipt {...receiptProps} />
      </div>
      <div
        className={isMobile ? "px-5" : "mx-auto w-full max-w-[480px] px-5"}
        style={{
          display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: 10,
        }}
      >
        {/* Sending lives on the success screen, which owns the sale refs the
            backend needs — a second copy of the button here had no handler
            and no way to get one. */}
        <Btn label="Print Bill" icon={<Printer size={16} />} onClick={() => print(<BillReceipt {...receiptProps} />)} style={{ width: "100%", background: C.burg }} />
        <Btn label="Back to Sale" variant="ghost" onClick={onClose} style={{ width: "100%" }} />
      </div>
    </div>
  );
}
