import React, { useState } from "react";
import { Search } from "lucide-react";
import { C, F, card, inputStyle } from "./tokens";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";

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
                fontFamily: F.u, fontSize: 9.5, fontWeight: 700,
                color: type === "Warp" ? "#7A5010" : type === "Resham" ? "#7A5E1C" : C.burg, 
                background: type === "Warp" ? "rgba(196,146,58,0.14)" : type === "Resham" ? "rgba(200,155,71,0.13)" : "rgba(107,26,42,0.08)",
                padding: "2px 6px", borderRadius: 4 
              }}>{type}</span>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{desc}</span>
              <span style={{ fontFamily: F.m, fontSize: 11.5, fontWeight: 700, color: C.burg }}>{qty}</span>
            </div>
          );
        }
        return (
          <div key={idx} style={{ fontFamily: F.u, fontSize: 12.5, color: C.text }}>
            {p}
          </div>
        );
      })}
    </div>
  );
}

interface ReceiptHistoryTableProps {
  receiptHistory: ReceiptRecord[];
  compact?: boolean;
}

export function ReceiptHistoryTable({ receiptHistory, compact = false }: ReceiptHistoryTableProps) {
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const PAGE_SIZE = 10;

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
      <div style={{ position: "relative", marginBottom: compact ? 10 : 12 }}>
        <Search size={14} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={historySearch} onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }} placeholder="Search by GRN ID, PO number, or vendor..."
          style={{ ...inputStyle, height: compact ? 40 : 42, paddingLeft: 34, fontSize: compact ? 13 : 13.5 }} />
      </div>

      <DateFilterBar filter={historyDateFilter} onChange={f => { setHistoryDateFilter(f); setHistoryPage(1); }} />

      <div style={{ ...card, overflow: "hidden", border: `1.5px solid ${C.bdr}` }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ background: C.inp }}>
                {["GRN Batch ID", "PO Reference", "Vendor", "Firm Name", "Date Received", "Materials", "Received By", "Status"].map(h => (
                  <th key={h} style={{ fontFamily: F.m, fontSize: 9.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left", padding: compact ? "9px 12px" : "12px 14px", whiteSpace: "nowrap" }}>{h}</th>
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
                      <span style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: compact ? "3px 9px" : "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>{r.status}</span>
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
              <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}
                style={{ padding: compact ? "4px 10px" : "6px 12px", borderRadius: compact ? 6 : 8, border: `1px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontSize: compact ? 11 : 12, color: C.text, cursor: historyPage === 1 ? "default" : "pointer", opacity: historyPage === 1 ? 0.5 : 1 }}>Prev</button>
              <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage === totalPages}
                style={{ padding: compact ? "4px 10px" : "6px 12px", borderRadius: compact ? 6 : 8, border: `1px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontSize: compact ? 11 : 12, color: C.text, cursor: historyPage === totalPages ? "default" : "pointer", opacity: historyPage === totalPages ? 0.5 : 1 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
