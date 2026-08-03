import React, { useState } from "react";
import { T, F } from "../../theme";
import { UnifiedSaree } from "../../../customers/contexts/SalesContext";
import { AgePill, Empty, Pill, ScrollTable, td, tdMono, th, inr } from "./primitives";

export type TableMode = "outstanding" | "sold" | "produced";

// ── Who made / supplied a saree, for tables that mix origins ─────────────────
export function sareeOriginName(s: UnifiedSaree): string {
  if (s.origin === "weaver")      return s.weaverName || "—";
  if (s.origin === "factoryLoom") return s.factoryLoomNumber || "—";
  return s.supplier || "—";
}
export function sareeOriginSub(s: UnifiedSaree): string {
  if (s.origin === "weaver")      return `Weaver · ${s.weaverId} · Loom ${s.weaverLoom}`;
  if (s.origin === "factoryLoom") return `Factory Loom · ${s.operatorName}`;
  return `External · ${s.invoiceNumber}`;
}

/** Sale-status chip used in the "Produced" view. */
function StatusChip({ s }: { s: UnifiedSaree }) {
  const cfg =
    s.status === "retail"    ? { l: "Sold · Retail",    c: "#4A7FB5" } :
    s.status === "wholesale" ? { l: "Sold · Wholesale", c: "#9B4DCA" } :
    s.status === "returned"  ? { l: "Returned",         c: T.crimson } :
                               { l: "In Stock",         c: T.green   };
  return <Pill label={cfg.l} color={cfg.c} bg={`${cfg.c}1A`} />;
}

// ── Saree detail rows (shared by weaver / loom / batch / purchase drilldowns) ──
export function SareeDetailTable({ sarees, mode = "outstanding", showReturn = false, showBatch = false, showSource = false }: {
  sarees: UnifiedSaree[]; mode?: TableMode; showReturn?: boolean; showBatch?: boolean; showSource?: boolean;
}) {
  if (sarees.length === 0) {
    return <Empty msg={mode === "sold" ? "No sarees sold here yet." : mode === "produced" ? "No sarees here." : "No sarees outstanding here."} />;
  }
  return (
    <ScrollTable>
      <thead>
        <tr>
          <th style={th}>Saree Code</th>
          {showBatch  && <th style={th}>Batch</th>}
          {showSource && <th style={th}>Made By</th>}
          <th style={th}>Saree Type</th>
          <th style={th}>Weight</th>
          <th style={th}>{showReturn ? "Received" : "QC Date"}</th>
          {mode === "outstanding" && <th style={th}>Days In Stock</th>}
          {mode === "produced"    && <th style={th}>Status</th>}
          {mode === "sold" && <>
            <th style={th}>Sold On</th>
            <th style={th}>Channel</th>
            <th style={th}>Customer</th>
            <th style={th}>Sale Ref</th>
          </>}
          <th style={{ ...th, textAlign: "right" }}>Cost</th>
          <th style={{ ...th, textAlign: "right" }}>{mode === "sold" ? "Sold For" : "Sell Price"}</th>
          {showReturn && <th style={th}>Return</th>}
        </tr>
      </thead>
      <tbody>
        {sarees.map(s => (
          <tr key={s.sareeId}>
            <td style={tdMono}>{s.sareeId}</td>
            {showBatch && <td style={tdMono}>{s.batchId || "—"}</td>}
            {showSource && (
              <td style={td}>
                <div style={{ fontWeight: 600 }}>{sareeOriginName(s)}</div>
                <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{sareeOriginSub(s)}</div>
              </td>
            )}
            <td style={td}>{s.sareeTypeCode !== "EX-000" ? `${s.sareeTypeCode} · ` : ""}{s.sareeTypeName}</td>
            <td style={{ ...td, fontFamily: F.mono, fontSize: 12.5 }}>{s.weight}</td>
            <td style={td}>{s.qcDate}</td>
            {mode === "outstanding" && <td style={td}><AgePill days={s.ageDays} /></td>}
            {mode === "produced"    && <td style={td}><StatusChip s={s} /></td>}
            {mode === "sold" && <>
              <td style={td}>{s.sale?.date || "—"}</td>
              <td style={td}>{s.sale ? <Pill label={s.sale.channel === "retail" ? "Retail" : "Wholesale"} color={s.sale.channel === "retail" ? "#4A7FB5" : "#9B4DCA"} bg={s.sale.channel === "retail" ? "rgba(74,127,181,0.12)" : "rgba(155,77,202,0.12)"} /> : "—"}</td>
              <td style={td}>{s.sale?.customer || "—"}</td>
              <td style={tdMono}>{s.sale?.saleRef || "—"}</td>
            </>}
            <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12.5 }}>{inr(s.costPrice)}</td>
            <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12.5, fontWeight: 700, color: mode === "sold" ? T.green : T.royalBurgundy }}>
              {mode === "sold" ? inr(s.sale?.amount || 0) : inr(s.finalAmount)}
            </td>
            {showReturn && (
              <td style={td}>
                {s.ret
                  ? <div>
                      <Pill label={s.ret.restocked ? "Returned · Restocked" : "Returned · Not restocked"} color={T.crimson} bg="rgba(192,57,43,0.10)" />
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>{s.ret.returnRef} · {s.ret.date}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{s.ret.reason}</div>
                    </div>
                  : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  );
}

// ── Produced / Sold / Outstanding sub-tabs inside an expanded group row ───────
export function DrilldownTabs({ produced, sold, outstanding, showBatch = false, showSource = false, producedLabel = "Produced" }: {
  produced: UnifiedSaree[]; sold: UnifiedSaree[]; outstanding: UnifiedSaree[];
  showBatch?: boolean; showSource?: boolean; producedLabel?: string;
}) {
  const [view, setView] = useState<TableMode>("outstanding");
  const tabs: { key: TableMode; label: string; rows: UnifiedSaree[]; color: string }[] = [
    { key: "produced",    label: producedLabel,  rows: produced,    color: T.luxuryBrown },
    { key: "sold",        label: "Sold",         rows: sold,        color: T.green },
    { key: "outstanding", label: "Outstanding",  rows: outstanding, color: T.crimson },
  ];
  const active = tabs.find(t => t.key === view) || tabs[2];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {tabs.map(t => {
          const on = view === t.key;
          return (
            <button key={t.key} onClick={() => setView(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
                padding: "8px 16px", borderRadius: 99, fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                background: on ? t.color : "#FFFFFF",
                color: on ? "#FFFDF9" : T.taupe,
                border: on ? "none" : `1.5px solid ${T.borderDef}`,
                transition: "all 0.16s",
              }}>
              {t.label}
              <span style={{
                fontFamily: F.mono, fontSize: 12, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.07)",
                color: on ? "#FFFDF9" : t.color,
              }}>{t.rows.length}</span>
            </button>
          );
        })}
      </div>
      <SareeDetailTable sarees={active.rows} mode={active.key} showBatch={showBatch} showSource={showSource} />
    </div>
  );
}
