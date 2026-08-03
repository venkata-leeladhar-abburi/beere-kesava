import React from "react";
import { Pagination, UsePaginationReturn } from "../../../../shared/ui/DataPagination";
import { ageBucket } from "../../../customers/contexts/SalesContext";
import { T, F, th, td, tdMono } from "./theme";
import { WeaverSareeRow, TabKey, tabDate } from "./types";
import { inr, fmtDate, AGE_COLOR, QC_CFG, FIN_CFG } from "./utils";

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 11,
      fontWeight: 700, color, background: `${color}1A`, borderRadius: 99, padding: "3px 9px", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

interface MainSareesTableProps {
  pageRows: WeaverSareeRow[];
  visible: WeaverSareeRow[];
  selectable: boolean;
  selectedIds?: Set<string>;
  onToggleAll?: (visibleIds: string[]) => void;
  onToggleRow?: (sareeId: string) => void;
  isAll: boolean;
  isLoom: boolean;
  tab: TabKey;
  dateHeader: string;
  showQcMoney: boolean;
  showMoney: boolean;
  pag: UsePaginationReturn;
}

export function MainSareesTable({
  pageRows, visible, selectable, selectedIds, onToggleAll, onToggleRow,
  isAll, isLoom, tab, dateHeader, showQcMoney, showMoney, pag
}: MainSareesTableProps) {
  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ background: T.warmCream }}>
              {selectable && (
                <th style={{ ...th, width: 34 }}>
                  <input type="checkbox"
                    checked={visible.length > 0 && visible.every(r => selectedIds?.has(r.sareeId))}
                    onChange={() => onToggleAll?.(visible.map(r => r.sareeId))}
                    style={{ cursor: "pointer" }} />
                </th>
              )}
              <th style={th}>Saree ID</th>
              <th style={th}>Batch</th>
              {isAll && <th style={th}>Weaver / Loom</th>}
              {!isLoom && <th style={th}>Loom</th>}
              <th style={th}>Saree Type</th>
              <th style={th}>Colour</th>
              <th style={th}>Bulk Order</th>
              <th style={th}>{dateHeader}</th>
              {tab === "sold" && <><th style={th}>Channel</th><th style={th}>Customer</th></>}
              {tab === "outstanding" && <th style={th}>Days In Stock</th>}
              {(tab === "semi" || tab === "defective") && <th style={th}>Defects</th>}
              <th style={th}>QC Status</th>
              <th style={th}>Finishing</th>
              <th style={th}>Finishing Completed</th>
              {showQcMoney && <>
                <th style={{ ...th, textAlign: "right" }}>Making Charge</th>
                <th style={{ ...th, textAlign: "right" }}>Deducted</th>
                <th style={{ ...th, textAlign: "right" }}>Weaver Earns</th>
              </>}
              {showMoney && <th style={{ ...th, textAlign: "right" }}>{tab === "sold" ? "Sold For" : "Sell Price"}</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, idx) => {
              const qc = QC_CFG[r.qcStatus];
              const fin = FIN_CFG[r.finishingStatus];
              const typeLabel = r.sareeTypeCode
                ? `${r.sareeTypeCode}${r.sareeTypeName ? ` · ${r.sareeTypeName}` : ""}`
                : "—";
              return (
                <tr key={r.sareeId} style={{ background: selectedIds?.has(r.sareeId) ? "rgba(110,15,45,0.05)" : idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.4)" }}>
                  {selectable && (
                    <td style={td}>
                      <input type="checkbox" checked={!!selectedIds?.has(r.sareeId)}
                        onChange={() => onToggleRow?.(r.sareeId)} style={{ cursor: "pointer" }} />
                    </td>
                  )}
                  <td style={tdMono}>{r.sareeId}</td>
                  <td style={tdMono}>{r.batchId || "—"}</td>
                  {isAll && (
                    <td style={{ ...td, fontWeight: 600, color: r.ownerKind === "loom" ? T.antiqueGold : T.royalBurgundy }}>
                      {r.ownerLabel || "—"}
                    </td>
                  )}
                  {!isLoom && (
                    <td style={{ ...td, fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, fontWeight: 700 }}>
                      {r.loomNumber != null ? `L${r.loomNumber}` : "—"}
                    </td>
                  )}
                  <td style={td}>{typeLabel}</td>
                  <td style={td}>
                    {r.color
                      ? r.color
                      : <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>}
                  </td>
                  <td style={{ ...td, color: r.bulkOrderLabel ? T.royalBurgundy : T.green, fontWeight: 600 }}>
                    {r.bulkOrderLabel || "General Stock"}
                  </td>
                  <td style={td}>{fmtDate(tabDate(r, tab))}</td>

                  {tab === "sold" && <>
                    <td style={td}>
                      {r.stock?.sale
                        ? <Chip label={r.stock.sale.channel === "retail" ? "Retail" : "Wholesale"}
                            color={r.stock.sale.channel === "retail" ? T.blue : T.purple} />
                        : "—"}
                    </td>
                    <td style={td}>{r.stock?.sale?.customer || "—"}</td>
                  </>}

                  {tab === "outstanding" && (
                    <td style={td}>
                      {r.stock
                        ? <Chip label={`${r.stock.ageDays} days`} color={AGE_COLOR[ageBucket(r.stock.ageDays)]} />
                        : "—"}
                    </td>
                  )}

                  {(tab === "semi" || tab === "defective") && (
                    <td style={td}>
                      {r.defects.length > 0
                        ? <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                            {r.defects.map(d => (
                              <span key={d} style={{
                                fontFamily: F.ui, fontSize: 10.5, fontWeight: 600, color: qc.color,
                                background: `${qc.color}1A`, borderRadius: 5, padding: "2px 7px",
                              }}>{d}</span>
                            ))}
                          </span>
                        : "—"}
                    </td>
                  )}

                  <td style={td}><Chip label={qc.label} color={qc.color} /></td>
                  <td style={td}>
                    {r.finishingStatus === "none"
                      ? <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>
                      : <Chip label={fin.label} color={fin.color} />}
                  </td>
                  <td style={td}>{fmtDate(r.finishingCompletedDate)}</td>

                  {showQcMoney && <>
                    <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12 }}>
                      {r.makingCharge != null ? inr(r.makingCharge) : "—"}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12, color: T.crimson, fontWeight: 700 }}>
                      {r.deduction != null ? `− ${inr(r.deduction)}` : "—"}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: r.payable ? T.green : T.crimson }}>
                      {r.payable != null ? inr(r.payable) : "—"}
                    </td>
                  </>}

                  {showMoney && (
                    <td style={{
                      ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700,
                      color: tab === "sold" ? T.green : T.royalBurgundy,
                    }}>
                      {r.stock ? inr(tab === "sold" ? (r.stock.sale?.amount || 0) : r.stock.finalAmount) : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "0 14px" }}>
        <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
      </div>
    </div>
  );
}
