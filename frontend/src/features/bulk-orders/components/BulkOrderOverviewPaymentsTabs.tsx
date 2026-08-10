import React from "react";
import { AlertTriangle } from "lucide-react";
import { BulkOrder } from "../contexts/BulkOrderContext";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";

const T = {
  silkCream: "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  luxuryBrown: "#3B2314",
  taupe: "#69635E",
  green: "#1E6640",
  greenMid: "#2D9158",
  crimson: "#C0392B",
  crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

interface OverviewTabProps {
  live: BulkOrder;
  producedCount: number;
  dispatchedCount: number;
  damagedCount: number;
  matchedInvoice: { id: string } | null;
  amountDue: number;
  amountPaid: number;
  inr: (n: number) => string;
}

export function BulkOrderOverviewTab({
  live,
  producedCount,
  dispatchedCount,
  damagedCount,
  matchedInvoice,
  amountDue,
  amountPaid,
  inr,
}: OverviewTabProps) {
  const card: React.CSSProperties = { background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Sarees", value: String(live.total) },
          { label: "Completed", value: String(producedCount), color: T.green },
          { label: "Dispatched", value: String(dispatchedCount), color: T.royalBurgundy },
          { label: "Damaged / Review", value: String(damagedCount), color: damagedCount ? T.crimson : T.green },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: (s as any).color || T.luxuryBrown }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1.2px", color: T.taupe, marginBottom: 14 }}>ORDER DETAILS</div>
          {[
            ["Saree Type", live.sareeType],
            ["Created", live.createdDate || "—"],
            ["Delivery Deadline", live.due],
            ["GST Number", live.gstCode || "—"],
            ["Linked Batches", (live.linkedBatches ?? live.batches ?? []).join(", ") || "—"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.borderDef}` }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{k}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" as const }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1.2px", color: T.taupe, marginBottom: 14 }}>DISPATCH & PAYMENT STATUS</div>
          {[
            ["Dispatch Status", live.dispatchStatus ?? "pending"],
            ["Dispatch Date", live.dispatchDate || "—"],
            ["Invoice Number", live.invoiceId || matchedInvoice?.id || "—"],
            ["Payment Status", live.paymentStatus ?? "pending"],
            ["Estimated Value", amountDue ? inr(amountDue) : "—"],
            ["Amount Paid", amountPaid ? inr(amountPaid) : "₹0"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.borderDef}`, textTransform: k.includes("Status") ? "capitalize" as const : "none" as const }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{k}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" as const, textTransform: "capitalize" as const }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {(live.notes || live.instructions) && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "1.2px", color: T.taupe, marginBottom: 10 }}>NOTES / INSTRUCTIONS</div>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.65, margin: 0 }}>{live.notes || live.instructions}</p>
        </div>
      )}

      {(live.shortage ?? 0) > 0 && (
        <div style={{ background: T.crimsonBg, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle size={18} color={T.crimson} />
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.crimson }}>Shortage of {live.shortage} sarees against this order — check material issue or reassign weavers.</span>
        </div>
      )}
    </div>
  );
}

interface PaymentsTabProps {
  amountDue: number;
  amountPaid: number;
  balance: number;
  payments: any[];
  matchedInvoice: { id: string } | null;
  inr: (n: number) => string;
}

export function BulkOrderPaymentsTab({
  amountDue,
  amountPaid,
  balance,
  payments,
  matchedInvoice,
  inr,
}: PaymentsTabProps) {
  const card: React.CSSProperties = { background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "20px 22px" };

  type PayRow = any & { __idx: number };
  const rows: PayRow[] = payments.map((p, i) => ({ ...p, __idx: i }));

  const columns: ColumnDef<PayRow>[] = [
    {
      id: "amount", header: "Amount", accessor: p => p.amount,
      cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.greenMid }}>{inr(p.amount)}</span>,
    },
    {
      id: "date", header: "Date", accessor: p => p.date,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</span>,
    },
    {
      id: "method", header: "Method", accessor: p => p.method,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.method}</span>,
    },
    {
      id: "utr", header: "UTR / Reference", accessor: p => p.utr,
      cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{p.utr}</span>,
    },
    {
      id: "firm", header: "Firm", accessor: p => p.firmName,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.firmName || "—"}</span>,
    },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Order Value", value: inr(amountDue), color: T.luxuryBrown },
          { label: "Amount Paid", value: inr(amountPaid), color: T.greenMid },
          { label: "Outstanding Balance", value: inr(balance), color: balance > 0 ? T.crimson : T.green },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderDef}`, fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>
          Payment History {matchedInvoice ? `· ${matchedInvoice.id}` : ""}
        </div>
        {payments.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No payments recorded against this order yet.</div>
        ) : (
          <DataTable columns={columns} data={rows} getRowId={p => String(p.__idx)} />
        )}
      </div>
    </div>
  );
}
