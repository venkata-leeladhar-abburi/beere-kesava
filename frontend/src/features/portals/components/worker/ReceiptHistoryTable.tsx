import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { C, F, card } from "./tokens";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { Button, Input } from "../../../../shared/ui/primitives";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { jariToReels } from "../../../../shared/lib/weightUnits";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import type { ReconResult } from "@/lib/domain/status";

export interface ReceiptRecord {
  grnId: string;
  poRef: string;
  vendor: string;
  firmName: string;
  dateReceived: string;
  materialsSummary: string;
  receivedBy: string;
  // Reconciliation result of a GRN receipt against its PO — lib/domain/status.ts's
  // `ReconResult` (Part D.1: found living inside `status` as "Match"/"Short"/
  // "Excess", not a lifecycle state, so it's its own typed column, not a StatusPill).
  status: ReconResult;
}

const HIST_STATUS_CFG: Record<ReconResult, { label: string; color: string; bg: string }> = {
  match:  { label: "Match",  color: C.green, bg: "rgba(30,102,64,0.10)" },
  short:  { label: "Short",  color: C.gold,  bg: "rgba(196,146,58,0.14)" },
  excess: { label: "Excess", color: "#1565C0", bg: "rgba(21,101,192,0.10)" },
};

function renderMaterialsSummary(summary: string) {
  if (!summary) return null;
  const parts = summary.split(", ");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {parts.map((p, idx) => {
        const matchDesc = p.match(/^([^-]+)\s*-\s*([^(]+)\s*\(([^)]+)\)$/);
        if (matchDesc) {
          const type = matchDesc[1].trim();
          const desc = matchDesc[2].trim();
          const qty = matchDesc[3].trim();
          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ 
                fontFamily: F.u, fontSize: 12, fontWeight: 700,
                color: type === "Warp" ? "#7A5010" : type === "Resham" ? "#7A5E1C" : C.burg, 
                background: type === "Warp" ? "rgba(196,146,58,0.14)" : type === "Resham" ? "rgba(200,155,71,0.13)" : "rgba(110,15,45,0.08)",
                padding: "2px 6px", borderRadius: 4 
              }}>{type}</span>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{desc}</span>
              <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.burg }}>{qty}</span>
            </div>
          );
        }
        return (
          <div key={idx} style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>
            {p}
          </div>
        );
      })}
    </div>
  );
}

interface ReceiptHistoryTableProps {
  receiptHistory?: ReceiptRecord[];
  compact?: boolean;
}

export function ReceiptHistoryTable({ receiptHistory: propReceiptHistory, compact = false }: ReceiptHistoryTableProps) {
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const PAGE_SIZE = 10;

  const { data: rawGrns } = useQuery({
    queryKey: ["grn-receipts"],
    queryFn: () => rawMaterialsApi.listGrns(),
  });

  const receiptHistory = useMemo<ReceiptRecord[]>(() => {
    if (rawGrns?.items && rawGrns.items.length > 0) {
      return rawGrns.items.map(g => {
        const anyRejected = g.items.some(i => Number(i.rejectedQuantity ?? 0) > 0);
        return {
          grnId: g.id,
          poRef: g.invoiceNo ?? `PO-${g.id.slice(-6)}`,
          vendor: g.supplierName ?? "Vendor",
          firmName: g.firm?.firmName ?? "—",
          dateReceived: g.receivedDate ? new Date(g.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
          materialsSummary: g.items.map(i => {
            const isJari = i.materialType === "JARI";
            const qty = isJari ? jariToReels(i.quantity, i.unit ?? "KG") : i.quantity;
            const unit = isJari ? "Reels" : "kg";
            return `${i.materialType === "WARP" ? "Warp" : i.materialType === "RESHAM" ? "Resham" : "Jari"} - ${i.name} (${qty} ${unit})`;
          }).join(", "),
          receivedBy: "—",
          status: (anyRejected ? "short" : "match") as ReconResult,
        };
      });
    }
    return propReceiptHistory ?? [];
  }, [rawGrns, propReceiptHistory]);

  const filteredHistory = receiptHistory
    .slice(0, 20)
    .filter(r => {
      if (!matchesDateFilter(r.dateReceived, historyDateFilter)) return false;
      if (!historySearch) return true;
      const q = historySearch.toLowerCase();
      return r.grnId.toLowerCase().includes(q) || r.poRef.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q);
    });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const pagedHistory = filteredHistory.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);

  const columns: ColumnDef<ReceiptRecord>[] = [
    { id: "grnId", header: "GRN Batch ID", accessor: r => r.grnId, cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.burg, whiteSpace: "nowrap" }}>{r.grnId}</span> },
    { id: "poRef", header: "PO Reference", accessor: r => r.poRef, cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 12, color: C.text }}>{r.poRef}</span> },
    { id: "vendor", header: "Vendor", accessor: r => r.vendor, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.vendor}</span> },
    { id: "firmName", header: "Firm Name", accessor: r => r.firmName, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted }}>{r.firmName}</span> },
    { id: "dateReceived", header: "Date Received", accessor: r => r.dateReceived, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted, whiteSpace: "nowrap" }}>{r.dateReceived}</span> },
    { id: "materials", header: "Materials", accessor: r => r.materialsSummary, cell: (_v, r) => renderMaterialsSummary(r.materialsSummary) },
    { id: "receivedBy", header: "Received By", accessor: r => r.receivedBy, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted, whiteSpace: "nowrap" }}>{r.receivedBy}</span> },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => {
        const sc = HIST_STATUS_CFG[r.status];
        return <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: sc.color, background: sc.bg, padding: compact ? "3px 9px" : "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{sc.label}</span>;
      },
    },
  ];

  return (
    <div style={{ padding: compact ? 0 : "8px 0" }}>
      <div style={{ marginBottom: compact ? 10 : 12 }}>
        <Input
          value={historySearch}
          onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
          placeholder="Search by GRN ID, PO number, or vendor..."
          iconLeft={Search}
          containerClassName={compact ? "h-10" : "h-[42px]"}
        />
      </div>

      <DateFilterBar filter={historyDateFilter} onChange={f => { setHistoryDateFilter(f); setHistoryPage(1); }} />

      <div style={{ ...card, overflow: "hidden", border: `1.5px solid ${C.bdr}` }}>
        <div style={{ overflowX: "auto", minWidth: 760 }}>
          <DataTable
            columns={columns}
            data={pagedHistory}
            getRowId={r => r.grnId}
            emptyTitle="No receipts found."
          />
        </div>
        {totalPages > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: compact ? "10px 14px" : "12px 16px", borderTop: `1px solid ${C.bdr}` }}>
            <span style={{ fontFamily: F.u, fontSize: compact ? 11.5 : 12.5, color: C.muted }}>Page {historyPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: compact ? 6 : 8 }}>
              <Button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                size="sm"
                className={"h-auto rounded-md border border-[rgba(110,15,45,0.12)] bg-white text-[#1A0A0F] " + (compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs")}
              >Prev</Button>
              <Button
                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages}
                size="sm"
                className={"h-auto rounded-md border border-[rgba(110,15,45,0.12)] bg-white text-[#1A0A0F] " + (compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs")}
              >Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
