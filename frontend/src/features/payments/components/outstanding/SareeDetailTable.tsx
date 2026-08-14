import React, { useState } from "react";
import { T, F } from "../../theme";
import { UnifiedSaree } from "@/features/customers";
import { AgePill, Empty, Pill, inr } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { useDataAccess } from "@/shared/ui/domain";

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
  const canSeeCost = useDataAccess("cost");

  if (sarees.length === 0) {
    return <Empty msg={mode === "sold" ? "No sarees sold here yet." : mode === "produced" ? "No sarees here." : "No sarees outstanding here."} />;
  }

  const columns: ColumnDef<UnifiedSaree>[] = [
    { id: "sareeId", header: "Saree Code", priority: 1, accessor: s => s.sareeId, type: "code" },
    ...(showBatch ? [{ id: "batchId", header: "Batch", priority: 3 as const, accessor: (s: UnifiedSaree) => s.batchId, type: "code" as const, cell: (_v: unknown, s: UnifiedSaree) => s.batchId || "—" }] : []),
    ...(showSource ? [{
      id: "source", header: "Made By", accessor: (s: UnifiedSaree) => sareeOriginName(s),
      cell: (_v: unknown, s: UnifiedSaree) => (
        <>
          <div style={{ fontWeight: 600 }}>{sareeOriginName(s)}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{sareeOriginSub(s)}</div>
        </>
      ),
    }] : []),
    { id: "sareeType", header: "Saree Type", accessor: s => s.sareeTypeName, cell: (_v, s) => (s.sareeTypeCode !== "EX-000" ? `${s.sareeTypeCode} · ` : "") + s.sareeTypeName },
    { id: "weight", header: "Weight", priority: 3, accessor: s => s.weight, cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12 }}>{s.weight}</span> },
    { id: "date", header: showReturn ? "Received" : "QC Date", priority: 3, accessor: s => s.qcDate },
    ...(mode === "outstanding" ? [{ id: "ageDays", header: "Days In Stock", accessor: (s: UnifiedSaree) => s.ageDays, sortable: true, cell: (_v: unknown, s: UnifiedSaree) => <AgePill days={s.ageDays} /> }] : []),
    ...(mode === "produced" ? [{ id: "status", header: "Status", accessor: (s: UnifiedSaree) => s.status, cell: (_v: unknown, s: UnifiedSaree) => <StatusChip s={s} /> }] : []),
    ...(mode === "sold" ? [
      { id: "soldOn", header: "Sold On", accessor: (s: UnifiedSaree) => s.sale?.date, cell: (_v: unknown, s: UnifiedSaree) => s.sale?.date || "—" },
      { id: "channel", header: "Channel", accessor: (s: UnifiedSaree) => s.sale?.channel, cell: (_v: unknown, s: UnifiedSaree) => s.sale ? <Pill label={s.sale.channel === "retail" ? "Retail" : "Wholesale"} color={s.sale.channel === "retail" ? "#4A7FB5" : "#9B4DCA"} bg={s.sale.channel === "retail" ? "rgba(74,127,181,0.12)" : "rgba(155,77,202,0.12)"} /> : "—" },
      { id: "customer", header: "Customer", accessor: (s: UnifiedSaree) => s.sale?.customer, cell: (_v: unknown, s: UnifiedSaree) => s.sale?.customer || "—" },
      { id: "saleRef", header: "Sale Ref", accessor: (s: UnifiedSaree) => s.sale?.saleRef, type: "code" as const, cell: (_v: unknown, s: UnifiedSaree) => s.sale?.saleRef || "—" },
    ] : []),
    { id: "cost", header: "Cost", priority: 3, accessor: s => s.costPrice, align: "end", cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12 }}>{canSeeCost ? inr(s.costPrice) : "••••"}</span> },
    {
      id: "amount", header: mode === "sold" ? "Sold For" : "Sell Price", accessor: s => (mode === "sold" ? s.sale?.amount || 0 : s.finalAmount), align: "end",
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: mode === "sold" ? T.green : T.royalBurgundy }}>{mode === "sold" ? inr(s.sale?.amount || 0) : inr(s.finalAmount)}</span>,
    },
    ...(showReturn ? [{
      id: "return", header: "Return", accessor: (s: UnifiedSaree) => s.ret?.returnRef,
      cell: (_v: unknown, s: UnifiedSaree) => s.ret
        ? <div>
            <Pill label={s.ret.restocked ? "Returned · Restocked" : "Returned · Not restocked"} color={T.crimson} bg="rgba(192,57,43,0.10)" />
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{s.ret.returnRef} · {s.ret.date}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.ret.reason}</div>
          </div>
        : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>,
    }] : []),
  ];

  return (
    <DataTable<UnifiedSaree>
      responsive
      columns={columns}
      data={sarees}
      getRowId={s => s.sareeId}
      caption="Saree detail table"
    />
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
            <div key={t.key} style={{ "--tab-color": t.color } as React.CSSProperties}>
              <Button variant={on ? "primary" : "secondary"} size="sm" onClick={() => setView(t.key)}
                className={on
                  ? "rounded-full border-none bg-[var(--tab-color)] text-[#FFFDF9]"
                  : "rounded-full border-[1.5px] border-[var(--border-default)] bg-white text-[var(--text-tertiary)]"}>
                {t.label}
                <span style={{
                  fontFamily: F.ui, fontSize: 12, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                  background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.07)",
                  color: on ? "#FFFDF9" : t.color,
                }}>{t.rows.length}</span>
              </Button>
            </div>
          );
        })}
      </div>
      <SareeDetailTable sarees={active.rows} mode={active.key} showBatch={showBatch} showSource={showSource} />
    </div>
  );
}
