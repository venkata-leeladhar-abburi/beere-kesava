import React, { useState, useMemo } from "react";
import { FileText, Truck } from "lucide-react";
import { Quotation } from "../../../finishing/contexts/FinishingContext";
import { T, F, card } from "../theme";

// ── Quotations section (raised from this page, dispatch once finishing is done) ─
function quotationStatusStyle(status: Quotation["status"]) {
  switch (status) {
    case "received":          return { bg: "rgba(30,102,64,0.10)",   color: T.green,       border: "rgba(30,102,64,0.22)"  };
    case "dispatched":        return { bg: "rgba(110,15,45,0.08)",   color: T.royalBurgundy, border: "rgba(110,15,45,0.18)" };
    case "partially-received": return { bg: "rgba(200,155,71,0.14)", color: "#8B6018",     border: "rgba(200,155,71,0.32)" };
    case "in-finishing":      return { bg: "rgba(200,155,71,0.10)",  color: "#8B6018",     border: "rgba(200,155,71,0.24)" };
    default:                  return { bg: "rgba(139,112,96,0.10)", color: T.taupe,       border: T.borderDef };
  }
}

export function QuotationsSection({ quotations, onDispatch }: { quotations: Quotation[]; onDispatch: (q: Quotation) => void }) {
  const [tab, setTab] = useState<"active" | "all">("active");
  const rows = useMemo(() =>
    [...quotations]
      .filter(q => tab === "all" || q.status !== "dispatched")
      .sort((a, b) => b.createdAt - a.createdAt),
  [quotations, tab]);

  if (quotations.length === 0) return null;

  return (
    <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FileText size={18} color={T.royalBurgundy} />
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>Quotations</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {([["active", "Active"], ["all", "All"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${tab === key ? T.royalBurgundy : T.borderDef}`, background: tab === key ? "rgba(110,15,45,0.06)" : "transparent", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: tab === key ? T.royalBurgundy : T.taupe, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No quotations raised yet.</div>
      ) : rows.map((q, i) => {
        const st = quotationStatusStyle(q.status);
        const receivedCount = q.sarees.filter(s => s.finishingStatus === "received").length;
        const canDispatch = q.status === "received" || q.status === "partially-received";
        return (
          <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 24px", borderBottom: i < rows.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.warmIvory, flexWrap: "wrap" as const }}>
            <div style={{ minWidth: 140 }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{q.quotationNumber}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{q.quotationDate}</div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{q.customerName}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{q.customerCity || "—"}</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, minWidth: 70 }}>{receivedCount}/{q.sarees.length}<span style={{ color: T.taupe, fontWeight: 400 }}> received</span></div>
            <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 999, padding: "3px 11px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: st.color, textTransform: "capitalize" as const, whiteSpace: "nowrap" as const }}>
              {q.status.replace("-", " ")}
            </div>
            <button onClick={() => canDispatch && onDispatch(q)} disabled={!canDispatch}
              title={canDispatch ? "Dispatch the received sarees from this quotation" : "Waiting on finishing to complete"}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: canDispatch ? `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)` : "rgba(139,112,96,0.12)", border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 12, color: canDispatch ? "#FFF" : T.taupe, cursor: canDispatch ? "pointer" : "not-allowed", whiteSpace: "nowrap" as const }}>
              <Truck size={13} /> Dispatch
            </button>
          </div>
        );
      })}
    </div>
  );
}
