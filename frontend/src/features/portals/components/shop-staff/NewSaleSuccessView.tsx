import React from "react";
import { motion } from "motion/react";
import { Check, Printer, MessageSquare, Plus } from "lucide-react";
import { C, F, Card, Btn, HeroHeader } from "./theme";
import type { SaleLine } from "./sale-cart";

interface NewSaleSuccessViewProps {
  lines: SaleLine[];
  custName: string;
  payment: "cash" | "upi" | "card" | "other" | null;
  total: number;
  canSeePrices: boolean;
  fmtPrice: (n: number) => string;
  onShowBill: () => void;
  onResetSale: () => void;
}

export function NewSaleSuccessView({
  lines,
  custName,
  payment,
  total,
  canSeePrices,
  fmtPrice,
  onShowBill,
  onResetSale,
}: NewSaleSuccessViewProps) {
  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · NEW SALE" title="New Retail" sub="Sale" />
      <div style={{ padding: "36px 20px 0", textAlign: "center" as const }}>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(30,102,64,0.10)", border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <Check size={38} color={C.green} />
          </div>
        </motion.div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.text, marginBottom: 6 }}>Sale Confirmed!</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 24 }}>Bill has been generated successfully.</div>
      </div>
      <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
        <div style={{ padding: 20 }}>
          <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 14, color: C.burg, textAlign: "center" as const, marginBottom: 14 }}>Beere Kesava & Brothers Silks · Est. 1999</div>
          <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
            {/* Line items first — a multi-saree bill has to show what was
                actually sold, not just one id. */}
            {lines.map(l => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg, minWidth: 0 }}>
                  {l.id}
                  <span style={{ fontFamily: F.u, color: C.muted }}> · {l.name}</span>
                </span>
                {canSeePrices && (
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, flexShrink: 0 }}>{fmtPrice(l.soldPrice)}</span>
                )}
              </div>
            ))}
            {[
              ["Customer", custName || "—", false],
              ["Date & Time", new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), true],
              ["Payment", payment?.toUpperCase() ?? "—", true],
            ].map(([k, v, mono]) => (
              <div key={k as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k as string}</span>
                <span style={{ fontFamily: mono ? F.m : F.u, fontSize: 13, color: C.text }}>{v as string}</span>
              </div>
            ))}
            {canSeePrices && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${C.bdr}`, paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Total ({lines.length} saree{lines.length !== 1 ? "s" : ""})</span>
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>{fmtPrice(total)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 16 }}>
        <Btn label="Print Bill" icon={<Printer size={16} />} onClick={onShowBill} style={{ width: "100%", background: C.burg }} />
        <Btn label="Send to Customer on WhatsApp" icon={<MessageSquare size={16} />} style={{ width: "100%", background: C.green }} />
      </div>

      <div style={{ padding: "0 20px" }}>
        <Btn label="Record Another Sale" icon={<Plus size={16} />} variant="ghost" onClick={onResetSale} style={{ width: "100%", borderColor: C.burg }} />
      </div>
    </div>
  );
}
