import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Square, CheckSquare, LayoutGrid, List } from "lucide-react";
import { C, F } from "../tokens";
import { type WeaverBatchData } from "./weaversData";
import { Button, IconButton, Select, SelectItem } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";

interface SareeSelectionTableProps {
  currentBatch: WeaverBatchData;
  entityName: string;
  entityAvatar: string;
  columnHeader?: string;
  doneCount: number;
  sareeSort: "serial" | "status";
  setSareeSort: (sort: "serial" | "status") => void;
  selectedSareeNos: Set<number>;
  selectSareeSlot: (no: number) => void;
  onToggleAll: () => void;
}

function SareeSelectionCard({
  s,
  entityName,
  entityAvatar,
  currentBatch,
  isSel,
  onSelect,
}: {
  s: {
    no: number;
    sareeId: string;
    status: string;
    isRework?: boolean;
    weaverLoom?: number | null;
  };
  entityName: string;
  entityAvatar: string;
  currentBatch: WeaverBatchData;
  isSel: boolean;
  onSelect: () => void;
}) {
  const isPending = s.status === "pending";
  const loom = s.weaverLoom ?? currentBatch.loomNumber;

  const statusCfg = s.status === "received" ? { label: "Received", bg: "rgba(30,102,64,0.10)", col: C.green, border: "rgba(30,102,64,0.25)" }
    : s.status === "defective" ? { label: "Defective", bg: "rgba(220,53,69,0.10)", col: C.crim, border: "rgba(220,53,69,0.25)" }
    : s.isRework ? { label: "Rework — Receive Again", bg: "rgba(110,15,45,0.10)", col: C.burg, border: "rgba(110,15,45,0.25)" }
    : { label: "Awaiting Receipt", bg: "rgba(200,155,71,0.14)", col: "#8D5802", border: "rgba(200,155,71,0.30)" };

  return (
    <div
      onClick={() => { if (isPending) onSelect(); }}
      style={{
        background: isSel ? "linear-gradient(135deg, #FFFDF9 0%, #FDF7ED 100%)" : "#FFFFFF",
        border: `1.5px solid ${isSel ? C.burg : C.bdr}`,
        borderRadius: 16,
        padding: 14,
        boxShadow: isSel ? "0 4px 16px rgba(110,15,45,0.12)" : "0 2px 10px rgba(0,0,0,0.04)",
        cursor: isPending ? "pointer" : "default",
        transition: "all 0.2s ease",
        position: "relative",
      }}
    >
      {/* Header: Checkbox + Saree Code + Serial No */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isPending ? (
            <div style={{ color: isSel ? C.burg : "rgba(110,15,45,0.30)", transition: "color 0.2s" }}>
              {isSel ? <CheckCircle2 size={20} className="fill-[#6E0F2D] text-white" /> : <Square size={20} />}
            </div>
          ) : (
            <div style={{ color: s.status === "received" ? C.green : C.crim }}>
              {s.status === "received" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </div>
          )}

          <span
            style={{
              fontFamily: F.m,
              fontSize: 13,
              fontWeight: 600,
              color: isSel ? "#FFF" : C.burg,
              background: isSel ? C.burg : "rgba(110,15,45,0.08)",
              border: `1px solid ${isSel ? C.burg : "rgba(110,15,45,0.16)"}`,
              borderRadius: 8,
              padding: "4px 10px",
              letterSpacing: "0.2px",
            }}
          >
            {s.sareeId}
          </span>
        </div>

        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 6, padding: "2px 8px" }}>
          #{s.no}
        </span>
      </div>

      {/* Grid details: Weaver + Saree Type + Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 12px", background: C.bg, borderRadius: 12, border: `1px solid ${C.bdr}` }}>
        <div>
          <div style={{ fontFamily: F.u, fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
            Weaver / Loom
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.u, fontSize: 9, fontWeight: 700, color: "#FFF" }}>{entityAvatar}</span>
            </div>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entityName}
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontFamily: F.u, fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
            Saree Type / Loom
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04" }}>
            {currentBatch.sareeTypeCode} {loom ? `· Loom ${loom}` : ""}
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>
          {currentBatch.bulkOrderLabel ? `Bulk Order: ${currentBatch.bulkOrderLabel}` : `Batch: ${currentBatch.id}`}
        </span>
        <span
          style={{
            fontFamily: F.u,
            fontSize: 11,
            fontWeight: 700,
            color: statusCfg.col,
            background: statusCfg.bg,
            border: `1px solid ${statusCfg.border}`,
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          {statusCfg.label}
        </span>
      </div>
    </div>
  );
}

export function SareeSelectionTable({
  currentBatch,
  entityName,
  entityAvatar,
  columnHeader = "Weaver / Loom",
  doneCount,
  sareeSort,
  setSareeSort,
  selectedSareeNos,
  selectSareeSlot,
  onToggleAll,
}: SareeSelectionTableProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const sortedSarees = [...currentBatch.sarees]
    .sort((a, b) => sareeSort === "status" ? a.status.localeCompare(b.status) : a.no - b.no);
  const pendingSarees = currentBatch.sarees.filter(s => s.status === "pending");
  const allPendingSelected = pendingSarees.length > 0 && pendingSarees.every(s => selectedSareeNos.has(s.no));

  const columns: ColumnDef<(typeof sortedSarees)[number]>[] = [
    {
      id: "select", header: "", accessor: () => null,
      cell: (_v, s) => {
        const isSel = selectedSareeNos.has(s.no);
        return s.status === "pending" ? (
          <IconButton
            icon={isSel ? CheckCircle2 : Square}
            label={isSel ? "Deselect saree" : "Select saree"}
            variant="ghost"
            size="sm"
            onClick={e => { e.stopPropagation(); selectSareeSlot(s.no); }}
            className={isSel ? "text-[#6E0F2D]" : "text-[rgba(110,15,45,0.20)]"}
          />
        ) : (
          <IconButton
            icon={s.status === "received" ? CheckCircle2 : AlertTriangle}
            label={s.status === "received" ? "Received" : "Defective"}
            variant="ghost"
            size="sm"
            disabled
            className={s.status === "received" ? "text-[#1E6640]" : "text-[#C0392B]"}
          />
        );
      },
    },
    {
      id: "no", header: "#", accessor: s => s.no,
      cell: (_v, s) => <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{s.no}</span>,
    },
    {
      id: "sareeId", header: "Saree ID", accessor: s => s.no, priority: 1,
      cell: (_v, s) => {
        const isSel = selectedSareeNos.has(s.no);
        const rowSareeId = s.sareeId;
        return s.status === "pending" ? (
          <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 500, color: isSel ? "#FFF" : C.burg, background: isSel ? C.burg : "rgba(110,15,45,0.08)", borderRadius: 8, padding: "4px 9px" }}>
            {rowSareeId}
          </span>
        ) : (
          <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 500, color: C.text, background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "4px 9px" }}>{rowSareeId}</span>
        );
      },
    },
    {
      id: "weaverLoom", header: columnHeader, accessor: () => entityName, priority: 3,
      cell: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF", lineHeight: 1 }}>{entityAvatar}</span>
          </div>
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{entityName}</span>
        </div>
      ),
    },
    {
      id: "loomNo", header: "Loom No.", accessor: s => s.weaverLoom ?? currentBatch.loomNumber ?? "—", priority: 3,
      cell: (_v, s) => {
        const loom = s.weaverLoom ?? currentBatch.loomNumber;
        return loom != null ? (
          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 9px" }}>Loom {loom}</span>
        ) : (
          <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>
        );
      },
    },
    {
      id: "sareeType", header: "Saree Type", accessor: () => currentBatch.sareeTypeCode, priority: 3,
      cell: () => <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 500, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 9px" }}>{currentBatch.sareeTypeCode}</span>,
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: () => currentBatch.bulkOrderLabel, priority: 3,
      cell: () => (
        <span style={{ fontFamily: F.u, fontSize: 12, color: currentBatch.bulkOrderLabel ? C.burg : C.muted }}>
          {currentBatch.bulkOrderLabel ?? "—"}
        </span>
      ),
    },
    {
      id: "status", header: "Status", accessor: s => s.status, type: "status",
      cell: (_v, s) => {
        const statusCfg = s.status === "received" ? { label: "Received", bg: "rgba(30,102,64,0.10)", col: C.green }
          : s.status === "defective" ? { label: "Defective", bg: "rgba(220,53,69,0.10)", col: C.crim }
          : s.isRework ? { label: "Rework — Receive Again", bg: "rgba(110,15,45,0.10)", col: C.burg }
          : { label: "Pending", bg: "rgba(200,155,71,0.14)", col: "#8D5802" };
        return <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: statusCfg.col, background: statusCfg.bg, borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>{statusCfg.label}</span>;
      },
    },
  ];

  return (
    <div style={{ margin: "20px 0 0" }}>
      <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Sarees in {currentBatch.id}
      </div>
      <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${C.bdr}`, boxShadow: "0 2px 12px rgba(74,6,27,0.07)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.bdr}`, background: C.bg, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.u, fontSize: 18, fontWeight: 600, color: C.wine, letterSpacing: "-0.01em" }}>{currentBatch.total} Sarees</span>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.green, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 999, padding: "4px 10px" }}>
              {doneCount} complete
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, whiteSpace: "nowrap" }}>
            {pendingSarees.length > 0 && (
              <Button variant="link" onClick={onToggleAll} className="gap-1.5 p-0 px-1.5 py-1 text-xs text-[#69635E] shrink-0">
                {allPendingSelected ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
                {allPendingSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>Sort by</span>
            <Select value={sareeSort} onValueChange={v => setSareeSort(v as "serial" | "status")} size="sm" className="shrink-0">
              <SelectItem value="serial">Default (#)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </Select>
          </div>
        </div>

        {/* View mode toggle buttons (Card View / Table View) — mobile only, just below filters */}
        <div className="flex md:hidden items-center justify-between gap-3 px-4 pt-3.5 pb-1">
          <div className="flex items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0">
            <Button
              onClick={() => setViewMode("card")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-2 px-3 text-[12px] font-bold ${
                viewMode === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <LayoutGrid size={15} /> Card View
            </Button>
            <Button
              onClick={() => setViewMode("table")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-2 px-3 text-[12px] font-bold ${
                viewMode === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <List size={15} /> Table View
            </Button>
          </div>
        </div>

        {/* Desktop View (md and up): Always Table View */}
        <div className="hidden md:block overflow-x-auto section-nav-scroll p-2">
          <div className="min-w-[950px]">
            <DataTable
              columns={columns}
              data={sortedSarees}
              getRowId={s => String(s.no)}
              onRowClick={s => { if (s.status === "pending") selectSareeSlot(s.no); }}
              rowClassName={s => (selectedSareeNos.has(s.no) ? "bk-saree-row-selected" : undefined)}
            />
          </div>
          <style>{`.bk-saree-row-selected { background: rgba(110,15,45,0.05) !important; }`}</style>
        </div>

        {/* Mobile View (< md): Toggles between Card View and Table View */}
        <div className="block md:hidden p-3.5">
          {viewMode === "card" ? (
            <div className="flex flex-col gap-3">
              {sortedSarees.map(s => (
                <SareeSelectionCard
                  key={s.no}
                  s={s}
                  entityName={entityName}
                  entityAvatar={entityAvatar}
                  currentBatch={currentBatch}
                  isSel={selectedSareeNos.has(s.no)}
                  onSelect={() => selectSareeSlot(s.no)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto section-nav-scroll p-1">
              <div className="min-w-[950px]">
                <DataTable
                  columns={columns}
                  data={sortedSarees}
                  getRowId={s => String(s.no)}
                  onRowClick={s => { if (s.status === "pending") selectSareeSlot(s.no); }}
                  rowClassName={s => (selectedSareeNos.has(s.no) ? "bk-saree-row-selected" : undefined)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
