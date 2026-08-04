import React from "react";
import { ChevronLeft, Flower2, Printer, MessageSquare } from "lucide-react";
import { C, F, Btn, Chip } from "./theme";

interface NewSaleBillModalProps {
  saree: { id: string; design: string; name: string };
  custName: string;
  phone: string;
  payment: "cash" | "upi" | "card" | "other" | null;
  soldPrice: number;
  canSeePrices: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
  fmtPrice: (n: number) => string;
  onClose: () => void;
}

export function NewSaleBillModal({
  saree,
  custName,
  phone,
  payment,
  soldPrice,
  canSeePrices,
  isMobile,
  isTablet,
  fmtPrice,
  onClose,
}: NewSaleBillModalProps) {
  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ background: C.burg, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><ChevronLeft size={24} color="#FFF" /></button>
        <span style={{ fontFamily: F.d, fontWeight: 600, fontSize: 18, color: "#FFF" }}>Bill Preview</span>
      </div>
      <div style={{
        margin: isMobile ? "16px 20px" : "24px auto",
        width: isMobile ? undefined : isTablet ? "80vw" : 480,
        maxWidth: isMobile ? undefined : isTablet ? "80vw" : 480,
        background: C.white, borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 2px 12px rgba(44,24,16,0.07)", overflow: "hidden",
      }}>
        <div style={{ background: C.burg, padding: "18px 20px", textAlign: "center" as const }}>
          <Flower2 size={24} color="rgba(255,255,255,0.7)" style={{ margin: "0 auto 6px" }} />
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Beere Kesava & Brothers Silks</div>
          <div style={{ fontFamily: F.m, fontSize: 12, color: C.gold, marginTop: 2 }}>Est. 1999</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.70)", marginTop: 4 }}>Main Street, Silk Market, Bangalore — 560001</div>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>Bill No: BKB-2026-1842</span>
            <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>13 Jun 2026 · 11:42 AM</span>
          </div>
          <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginBottom: 12 }}>
            {[
              ["Saree ID", saree.id], ["Design Code", saree.design], ["Description", saree.name],
              ["Customer", custName || "Smt. Annapurna"], ["Phone", `+91 ${phone || "98765 43210"}`],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
                <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          {canSeePrices && (
            <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Total Amount:</span>
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.gold }}>{fmtPrice(soldPrice)}</span>
            </div>
          )}
          <div style={{ textAlign: "center" as const, marginBottom: 8 }}>
            <Chip label={`Payment: ${payment === "upi" ? "UPI" : payment === "card" ? "Card" : payment === "cash" ? "Cash" : "Other"}`} color={C.burg} bg="rgba(107,26,42,0.08)" />
          </div>
          <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 14, textAlign: "center" as const }}>
            <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 13, color: C.burg }}>Thank you for shopping with Beere Kesava & Brothers Silks</div>
            <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 2, color: C.gold, marginTop: 4, textTransform: "uppercase" as const }}>Tradition · Trust · Timeless Quality</div>
          </div>
        </div>
      </div>
      <div style={{
        padding: isMobile ? "0 20px" : "0 20px",
        margin: isMobile ? undefined : "0 auto", width: isMobile ? undefined : isTablet ? "80vw" : 480,
        display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: 10,
      }}>
        <Btn label="Print Bill" icon={<Printer size={16} />} style={{ width: "100%", background: C.burg }} />
        <Btn label="Send to Customer on WhatsApp" icon={<MessageSquare size={16} />} style={{ width: "100%", background: C.green }} />
      </div>
    </div>
  );
}
