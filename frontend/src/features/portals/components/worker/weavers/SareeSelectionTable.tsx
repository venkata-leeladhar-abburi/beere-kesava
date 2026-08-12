import React from "react";
import { CheckCircle2, AlertTriangle, Square, CheckSquare } from "lucide-react";
import { C, F } from "../tokens";
import { type WeaverBatchData, type WEAVERS } from "./weaversData";
import { Button, IconButton, Select, SelectItem } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";

interface SareeSelectionTableProps {
  currentBatch: WeaverBatchData;
  selectedWeaver: typeof WEAVERS[0];
  doneCount: number;
  sareeSort: "serial" | "status";
  setSareeSort: (sort: "serial" | "status") => void;
  selectedSareeNos: Set<number>;
  selectSareeSlot: (no: number) => void;
  onToggleAll: () => void;
}

export function SareeSelectionTable({
  currentBatch,
  selectedWeaver,
  doneCount,
  sareeSort,
  setSareeSort,
  selectedSareeNos,
  selectSareeSlot,
  onToggleAll,
}: SareeSelectionTableProps) {
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
      id: "sareeId", header: "Saree ID", accessor: s => s.no,
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
      id: "weaverLoom", header: "Weaver / Loom", accessor: () => selectedWeaver.name,
      cell: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF", lineHeight: 1 }}>{selectedWeaver.avatar}</span>
          </div>
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{selectedWeaver.name}</span>
        </div>
      ),
    },
    {
      id: "loomNo", header: "Loom No.", accessor: () => selectedWeaver.looms,
      cell: () => <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 9px" }}>Loom {selectedWeaver.looms}</span>,
    },
    {
      id: "sareeType", header: "Saree Type", accessor: () => currentBatch.sareeTypeCode,
      cell: () => <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 500, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 8, padding: "4px 9px" }}>{currentBatch.sareeTypeCode}</span>,
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: () => currentBatch.bulkOrderLabel,
      cell: () => (
        <span style={{ fontFamily: F.u, fontSize: 12, color: currentBatch.bulkOrderLabel ? C.burg : C.muted }}>
          {currentBatch.bulkOrderLabel ?? "—"}
        </span>
      ),
    },
    {
      id: "status", header: "Status", accessor: s => s.status, type: "status",
      cell: (_v, s) => {
        // A rework saree is "pending" like any other, but it is coming back a
        // second time after a semi-approval — worth calling out so staff know
        // to check the reworked flaw rather than treating it as a first receipt.
        const statusCfg = s.status === "received" ? { label: "Received", bg: "rgba(30,102,64,0.10)", col: C.green }
          : s.status === "defective" ? { label: "Defective", bg: "rgba(220,53,69,0.10)", col: C.crim }
          : s.isRework ? { label: "Rework — Receive Again", bg: "rgba(110,15,45,0.10)", col: C.burg }
          : { label: "Pending", bg: "rgba(200,155,71,0.14)", col: "#8D5802" };
        return <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: statusCfg.col, background: statusCfg.bg, borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>{statusCfg.label}</span>;
      },
    },
  ];

  return (
    <div style={{ margin: "20px 16px 0" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {pendingSarees.length > 0 && (
              <Button variant="link" onClick={onToggleAll} className="gap-1.5 p-0 px-1.5 py-1 text-xs text-[#69635E]">
                {allPendingSelected ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
                {allPendingSelected ? "Deselect All" : "Select All"}
              </Button>
            )}
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Sort by</span>
            <Select value={sareeSort} onValueChange={v => setSareeSort(v as "serial" | "status")} size="sm">
              <SelectItem value="serial">Default (#)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </Select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <DataTable
            columns={columns}
            data={sortedSarees}
            getRowId={s => String(s.no)}
            onRowClick={s => { if (s.status === "pending") selectSareeSlot(s.no); }}
            rowClassName={s => (selectedSareeNos.has(s.no) ? "bk-saree-row-selected" : undefined)}
          />
          <style>{`.bk-saree-row-selected { background: rgba(110,15,45,0.05) !important; }`}</style>
        </div>
      </div>
    </div>
  );
}
