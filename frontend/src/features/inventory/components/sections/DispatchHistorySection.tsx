import React, { useState, useMemo } from "react";
import { Truck, Users, ShoppingBag, Clock, CheckCircle2 } from "lucide-react";
import { DispatchRecord } from "../../../finishing/contexts/FinishingContext";
import { T, F, card } from "../theme";

// ── Dispatch History section ──────────────────────────────────────────────────
// Exported for the Worker Staff portal — same component, same markup, so the two
// screens cannot fall out of step.
export function DispatchHistorySection({ dispatches, firms, onResume }: { dispatches: DispatchRecord[]; firms: { id: string; firmName: string }[]; onResume: (d: DispatchRecord) => void }) {
  const [tab, setTab] = useState<"all" | "shop" | "wholesale">("all");
  const rows = useMemo(() =>
    [...dispatches]
      .filter(d => tab === "all" || d.type === tab)
      .sort((a, b) => (b.id > a.id ? 1 : -1)),
  [dispatches, tab]);

  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: dispatches.length },
    { key: "shop",      label: "To Shop",   count: dispatches.filter(d => d.type === "shop").length },
    { key: "wholesale", label: "Wholesale", count: dispatches.filter(d => d.type === "wholesale").length },
  ];

  return (
    <div style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Truck size={18} color={T.royalBurgundy} />
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown }}>Dispatch History</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, border: `1px solid ${tab === t.key ? T.royalBurgundy : T.borderDef}`, background: tab === t.key ? "rgba(110,15,45,0.06)" : "transparent", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: tab === t.key ? T.royalBurgundy : T.taupe, cursor: "pointer" }}>
              {t.label} <span style={{ fontFamily: F.mono, fontSize: 12 }}>({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header row */}
      <div style={{ display: "grid", gridTemplateColumns: "110px 90px 1fr 130px 100px 80px 110px 150px", gap: 0, padding: "11px 24px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
        {["Date", "Type", "Destination", "LR / Transport", "Invoice", "Sarees", "Firm", "Status"].map((h, i) => (
          <div key={i} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{h}</div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No dispatches yet.</div>
      ) : rows.map((d, i) => {
        const firm = firms.find(f => f.id === d.firmId);
        const incomplete = d.pendingTransport || d.pendingReceipt;
        return (
          <div key={d.id} style={{ display: "grid", gridTemplateColumns: "110px 90px 1fr 130px 100px 80px 110px 150px", gap: 0, padding: "13px 24px", borderBottom: i < rows.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : T.warmIvory, alignItems: "center" }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{d.dispatchDate}</div>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: d.type === "wholesale" ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.14)", color: d.type === "wholesale" ? T.royalBurgundy : "#8B6018", border: `1px solid ${d.type === "wholesale" ? "rgba(110,15,45,0.18)" : "rgba(200,155,71,0.32)"}`, borderRadius: 999, padding: "2px 9px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const }}>
                {d.type === "wholesale" ? <Users size={10} /> : <ShoppingBag size={10} />}{d.type}
              </span>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{d.type === "wholesale" ? (d.customerName ?? "—") : "Shop / Showroom"}</div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{d.lrNumber || "—"}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{d.transportCompany || "—"}</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: d.invoiceNumber ? T.luxuryBrown : T.taupe }}>{d.invoiceNumber || "—"}</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{d.sareeIds.length}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.firmName || firm?.firmName || "—"}</div>
            <div>
              {incomplete ? (
                <button onClick={() => onResume(d)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "rgba(200,155,71,0.14)", border: `1px solid rgba(200,155,71,0.32)`, borderRadius: 999, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#8B6018", cursor: "pointer", whiteSpace: "nowrap" as const }}>
                  <Clock size={11} /> Complete Details
                </button>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.green }}>
                  <CheckCircle2 size={12} /> Complete
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
