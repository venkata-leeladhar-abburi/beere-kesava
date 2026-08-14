// Row 2 right card: outstanding balance by supplier + bill status split.

import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { T, F } from "../../theme";
import { BILL_STATUS_META } from "../../data";
import { formatMoney, rupees } from "@/lib/domain/money";
import { PerSupplierEntry } from "./TopSuppliersCard";

export interface BillStatusEntry { status: string; count: number; value: number }

export function OutstandingCard({
  card, cardTitle, cardSub, dueList, totalDue, perSupplierCount, billStatus,
}: {
  card: React.CSSProperties;
  cardTitle: React.CSSProperties;
  cardSub: React.CSSProperties;
  dueList: PerSupplierEntry[];
  totalDue: number;
  perSupplierCount: number;
  billStatus: BillStatusEntry[];
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AlertTriangle size={16} color={T.crimson} />
        <div style={cardTitle}>Outstanding by Supplier</div>
      </div>
      <div style={cardSub}>Billed minus settled in this period</div>
      <div style={{ background: totalDue > 0 ? T.crimsonBg : T.greenBg, borderRadius: 14, padding: "16px 18px", margin: "16px 0" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "1.1px", color: T.taupe, marginBottom: 6 }}>TOTAL PAYABLE</div>
        <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: totalDue > 0 ? T.crimson : T.green, lineHeight: 1 }}>{formatMoney(rupees(totalDue))}</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 6 }}>{dueList.length} of {perSupplierCount} suppliers unsettled</div>
      </div>
      {dueList.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.greenMid }}>
          <CheckCircle2 size={14} /> Every bill in this period is settled.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dueList.slice(0, 4).map(s => (
            <div key={s.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{s.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.crimson }}>{formatMoney(rupees(s.outstanding))}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: T.silkCream, overflow: "hidden" }}>
                <div style={{ width: `${(s.outstanding / (dueList[0].outstanding || 1)) * 100}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#C0392B,#E74C3C)" }} />
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>Terms {s.terms} · {formatMoney(rupees(s.paid))} of {formatMoney(rupees(s.billed))} paid</div>
            </div>
          ))}
        </div>
      )}
      {/* Bill status split */}
      <div style={{ borderTop: `1px solid ${T.borderDef}`, marginTop: 16, paddingTop: 14, display: "flex", gap: 8 }}>
        {billStatus.map(b => {
          const meta = BILL_STATUS_META[b.status] ?? { color: T.taupe, bg: T.silkCream };
          return (
            <div key={b.status} style={{ flex: 1, background: meta.bg, borderRadius: 10, padding: "9px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: meta.color, lineHeight: 1 }}>{b.count}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{b.status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
