import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { C, F, card } from "./tokens";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { Button, Input } from "../../../../shared/ui/primitives";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";

export interface ReceiptRecord {
  grnId: string;
  poRef: string;
  vendor: string;
  firmName: string;
  dateReceived: string;
  materialsSummary: string;
  receivedBy: string;
  status: "Match" | "Short" | "Excess";
}

const HIST_STATUS_CFG: Record<ReceiptRecord["status"], { color: string; bg: string }> = {
  Match:  { color: C.green, bg: "rgba(30,102,64,0.10)" },
  Short:  { color: C.gold,  bg: "rgba(196,146,58,0.14)" },
  Excess: { color: "#1565C0", bg: "rgba(21,101,192,0.10)" },
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
                background: type === "Warp" ? "rgba(196,146,58,0.14)" : type === "Resham" ? "rgba(200,155,71,0.13)" : "rgba(107,26,42,0.08)",
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
          materialsSummary: g.items.map(i => `${i.materialType === "WARP" ? "Warp" : i.materialType === "RESHAM" ? "Resham" : "Jari"} - ${i.name} (${i.quantity} ${i.quantity > 10 ? "kg" : "Buns"})`).join(", "),
          receivedBy: "—",
          status: (anyRejected ? "Short" : "Match") as ReceiptRecord["status"],
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
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ background: C.inp }}>
                {["GRN Batch ID", "PO Reference", "Vendor", "Firm Name", "Date Received", "Materials", "Received By", "Status"].map(h => (
                  <th key={h} style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left", padding: compact ? "9px 12px" : "12px 14px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedHistory.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: compact ? "20px" : "24px", textAlign: "center", fontFamily: F.u, fontSize: compact ? 12.5 : 13, color: C.muted }}>No receipts found.</td></tr>
              ) : pagedHistory.map((r, i) => {
                const sc = HIST_STATUS_CFG[r.status];
                return (
                  <tr key={i} style={{ borderTop: `1px solid ${C.bdr}`, background: compact ? "transparent" : i % 2 === 0 ? "#fff" : "rgba(247,242,234,0.3)" }}>
                    <td style={{ padding: compact ? "10px 12px" : "12px 14px", fontFamily: F.m, fontSize: 12, fontWeight: 700, color: C.burg, whiteSpace: "nowrap" }}>{r.grnId}</td>
                    <td style={{ padding: compact ? "10px 12px" : "12px 14px", fontFamily: F.m, fontSize: 12, color: C.text }}>{r.poRef}</td>
                    <td style={{ padding: compact ? "10px 12px" : "12px 14px", fontFamily: F.u, fontSize: 13, color: C.text }}>{r.vendor}</td>
                    <td style={{ padding: compact ? "10px 12px" : "12px 14px", fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted }}>{r.firmName}</td>
                    <td style={{ padding: compact ? "10px 12px" : "12px 14px", fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted, whiteSpace: "nowrap" }}>{r.dateReceived}</td>
                    <td style={{ padding: compact ? "10px 12px" : "12px 14px" }}>{renderMaterialsSummary(r.materialsSummary)}</td>
                    <td style={{ padding: compact ? "10px 12px" : "12px 14px", fontFamily: F.u, fontSize: compact ? 12 : 12.5, color: C.muted, whiteSpace: "nowrap" }}>{r.receivedBy}</td>
                    <td style={{ padding: compact ? "10px 12px" : "12px 14px" }}>
                      <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: sc.color, background: sc.bg, padding: compact ? "3px 9px" : "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{r.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: compact ? "10px 14px" : "12px 16px", borderTop: `1px solid ${C.bdr}` }}>
            <span style={{ fontFamily: F.u, fontSize: compact ? 11.5 : 12.5, color: C.muted }}>Page {historyPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: compact ? 6 : 8 }}>
              <Button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                size="sm"
                className={"h-auto rounded-md border border-[rgba(139,26,46,0.12)] bg-white text-[#1A0A0F] " + (compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs")}
              >Prev</Button>
              <Button
                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages}
                size="sm"
                className={"h-auto rounded-md border border-[rgba(139,26,46,0.12)] bg-white text-[#1A0A0F] " + (compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs")}
              >Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
