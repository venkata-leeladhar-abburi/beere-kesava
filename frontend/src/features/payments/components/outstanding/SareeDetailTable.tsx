import React, { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { T, F } from "../../theme";
import { UnifiedSaree } from "@/features/customers";
import { AgePill, Empty, Pill, inr } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { useDataAccess } from "@/shared/ui/domain";

export type TableMode = "outstanding" | "sold" | "produced";
export type DisplayMode = "card" | "table";

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

// ── Saree Card View Item ─────────────────────────────────────────────────────
function SareeCardItem({ s, mode }: { s: UnifiedSaree; mode: TableMode }) {
  const canSeeCost = useDataAccess("cost");

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid rgba(110,15,45,0.12)",
      borderRadius: 16,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    }}>
      {/* Code & Batch */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 700,
          background: "rgba(110,15,45,0.06)",
          color: T.royalBurgundy,
          padding: "4px 10px",
          borderRadius: 8,
          letterSpacing: "0.5px",
        }}>
          {s.sareeId}
        </span>
        {s.batchId && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: T.taupe }}>
            Batch: {s.batchId}
          </span>
        )}
      </div>

      {/* Saree Type */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginTop: 2 }}>
        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, flexShrink: 0 }}>Saree Type</span>
        <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, textAlign: "right" }}>
          {(s.sareeTypeCode !== "EX-000" ? `${s.sareeTypeCode} · ` : "") + s.sareeTypeName}
        </span>
      </div>

      {/* Days in stock / Status / Sold On */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
          {mode === "sold" ? "Sold Date" : mode === "produced" ? "Status" : "Days In Stock"}
        </span>
        {mode === "outstanding" ? (
          <AgePill days={s.ageDays} />
        ) : mode === "produced" ? (
          <StatusChip s={s} />
        ) : (
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{s.sale?.date || "—"}</span>
        )}
      </div>

      {/* QC Date */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>QC Date</span>
        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{s.qcDate || "—"}</span>
      </div>

      {/* Cost & Sell Price Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "1px solid rgba(110,15,45,0.08)", paddingTop: 10, marginTop: 4,
      }}>
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase" }}>Cost Price</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe }}>{canSeeCost ? inr(s.costPrice) : "••••"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase" }}>
            {mode === "sold" ? "Sold Amount" : "Sell Price"}
          </div>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: mode === "sold" ? T.green : T.royalBurgundy }}>
            {mode === "sold" ? inr(s.sale?.amount || 0) : inr(s.finalAmount)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Saree detail rows (shared by weaver / loom / batch / purchase drilldowns) ──
export function SareeDetailTable({ sarees, mode = "outstanding", showReturn = false, showBatch = false, showSource = false, displayMode = "card" }: {
  sarees: UnifiedSaree[]; mode?: TableMode; showReturn?: boolean; showBatch?: boolean; showSource?: boolean; displayMode?: DisplayMode;
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
    <>
      {/* Mobile Card View (shown when displayMode === 'card' on mobile screens) */}
      <div className={`grid grid-cols-1 gap-3.5 ${displayMode === "card" ? "block md:hidden" : "hidden"}`}>
        {sarees.map(s => (
          <SareeCardItem key={s.sareeId} s={s} mode={mode} />
        ))}
      </div>

      {/* Table View (always shown on desktop, and on mobile when displayMode === 'table') */}
      <div className={`w-full overflow-x-auto section-nav-scroll border border-[#E8DCC4] rounded-xl bg-white p-2 ${displayMode === "table" ? "block" : "hidden md:block"}`}>
        <div className="min-w-[800px]">
          <DataTable<UnifiedSaree>
            responsive={false}
            columns={columns}
            data={sarees}
            getRowId={s => s.sareeId}
            caption="Saree detail table"
            pagination
          />
        </div>
      </div>
    </>
  );
}

// ── Produced / Sold / Outstanding sub-tabs inside an expanded group row ───────
export function DrilldownTabs({ produced, sold, outstanding, showBatch = false, showSource = false, producedLabel = "Produced" }: {
  produced: UnifiedSaree[]; sold: UnifiedSaree[]; outstanding: UnifiedSaree[];
  showBatch?: boolean; showSource?: boolean; producedLabel?: string;
}) {
  const [view, setView] = useState<TableMode>("outstanding");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("table");

  const tabs: { key: TableMode; label: string; rows: UnifiedSaree[]; color: string }[] = [
    { key: "produced",    label: producedLabel,  rows: produced,    color: T.luxuryBrown },
    { key: "sold",        label: "Sold",         rows: sold,        color: T.green },
    { key: "outstanding", label: "Outstanding",  rows: outstanding, color: T.crimson },
  ];
  const active = tabs.find(t => t.key === view) || tabs[2];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        {/* Left Filter Pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

        {/* Right View Toggle (Mobile only: flex md:hidden) */}
        <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
          <Button
            onClick={() => setDisplayMode("card")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              displayMode === "card"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
            }`}
          >
            <LayoutGrid size={14} /> Card View
          </Button>
          <Button
            onClick={() => setDisplayMode("table")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              displayMode === "table"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
            }`}
          >
            <List size={14} /> Table View
          </Button>
        </div>
      </div>

      <SareeDetailTable sarees={active.rows} mode={active.key} showBatch={showBatch} showSource={showSource} displayMode={displayMode} />
    </div>
  );
}
