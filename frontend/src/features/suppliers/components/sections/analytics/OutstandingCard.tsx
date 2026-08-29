// Row 2 right card: outstanding balance by supplier + bill status split.

import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { T, F } from "../../theme";
import { BILL_STATUS_META } from "../../data";
import { formatMoney, rupees } from "@/lib/domain/money";
import { PerSupplierEntry } from "./TopSuppliersCard";

function CardBloom() {
  return (
    <span aria-hidden style={{
      position: "absolute", top: -70, right: -70, width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(110,15,45,0.05) 0%, rgba(110,15,45,0) 70%)",
      pointerEvents: "none",
    }} />
  );
}

function CardHeader({ icon: Icon, title, subtitle }: {
  icon: typeof AlertTriangle;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      margin: "-24px -28px 18px -28px", padding: "16px 20px",
      background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`,
      borderRadius: "14px 14px 0 0",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 36, height: 36, minWidth: 36, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.12)",
        }}>
          <Icon size={18} color="#FFFDF9" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: "#FFFDF9", letterSpacing: "-0.1px", lineHeight: 1.25 }}>
            {title}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.65)", marginTop: 3, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface BillStatusEntry { status: string; count: number; value: number }

export function OutstandingCard({
  card, dueList, totalDue, perSupplierCount, billStatus,
}: {
  card: React.CSSProperties;
  cardTitle?: React.CSSProperties;
  cardSub?: React.CSSProperties;
  dueList: PerSupplierEntry[];
  totalDue: number;
  perSupplierCount: number;
  billStatus: BillStatusEntry[];
}) {
  return (
    <div style={card}>
      <CardBloom />
      <CardHeader icon={AlertTriangle} title="Outstanding by Supplier" subtitle="Billed minus settled in this period" />
      <div style={{ background: totalDue > 0 ? "rgba(192,57,43,0.06)" : "rgba(110,15,45,0.05)", border: `1px solid ${totalDue > 0 ? "rgba(192,57,43,0.15)" : "rgba(110,15,45,0.15)"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.1px", color: T.taupe, marginBottom: 4 }}>TOTAL PAYABLE</div>
        <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: totalDue > 0 ? T.crimson : T.royalBurgundy, lineHeight: 1 }}>{formatMoney(rupees(totalDue))}</div>
        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>{dueList.length} of {perSupplierCount} suppliers unsettled</div>
      </div>
      {dueList.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.greenMid }}>
          <CheckCircle2 size={14} /> Every bill in this period is settled.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dueList.slice(0, 4).map(s => (
            <div key={s.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{s.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.crimson }}>{formatMoney(rupees(s.outstanding))}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(110,15,45,0.06)", overflow: "hidden" }}>
                <div style={{ width: `${(s.outstanding / (dueList[0].outstanding || 1)) * 100}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${T.royalBurgundy}, #C0392B)` }} />
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 3 }}>Terms {s.terms} · {formatMoney(rupees(s.paid))} of {formatMoney(rupees(s.billed))} paid</div>
            </div>
          ))}
        </div>
      )}
      {/* Bill status split */}
      <div style={{ borderTop: `1px solid rgba(200,155,71,0.18)`, marginTop: 14, paddingTop: 12, display: "flex", gap: 8 }}>
        {billStatus.map(b => {
          const meta = BILL_STATUS_META[b.status] ?? { color: T.taupe, bg: "rgba(255,255,255,0.70)" };
          return (
            <div key={b.status} style={{ flex: 1, background: meta.bg, borderRadius: 10, padding: "8px 10px", textAlign: "center", border: `1px solid rgba(200,155,71,0.18)` }}>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: meta.color, lineHeight: 1 }}>{b.count}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 3 }}>{b.status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
