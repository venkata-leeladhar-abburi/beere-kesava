import React from "react";
import { Pagination, UsePaginationReturn } from "../../../../shared/ui/DataPagination";
import { T, F, th, td, tdMono } from "./theme";
import { WeaverSareeRow } from "./types";
import { inr, fmtDate, externalSerialOf } from "./utils";

interface ExternalSareesTableProps {
  pageRows: WeaverSareeRow[];
  canSeeMoney: boolean;
  pag: UsePaginationReturn;
}

export function ExternalSareesTable({ pageRows, canSeeMoney, pag }: ExternalSareesTableProps) {
  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
          <thead>
            <tr style={{ background: T.warmCream }}>
              <th style={th}>Saree ID</th>
              <th style={th}>Serial No.</th>
              <th style={th}>Supplier</th>
              <th style={th}>Purchase Order</th>
              <th style={th}>Location</th>
              <th style={th}>Saree Type</th>
              <th style={th}>Colour</th>
              <th style={th}>Weight</th>
              <th style={th}>Purchase Date</th>
              {canSeeMoney && <th style={{ ...th, textAlign: "right" }}>Cost Price</th>}
              {canSeeMoney && <th style={{ ...th, textAlign: "right" }}>Sell %</th>}
              {canSeeMoney && <th style={{ ...th, textAlign: "right" }}>Final Amount</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, idx) => (
              <tr key={r.sareeId} style={{ background: idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.4)" }}>
                <td style={tdMono}>{r.sareeId}</td>
                <td style={{ ...td, fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown }}>
                  {externalSerialOf(r.sareeId) || "—"}
                </td>
                <td style={{ ...td, fontWeight: 600, color: T.royalBurgundy }}>{r.stock?.supplier || "—"}</td>
                <td style={{ ...td, fontFamily: F.mono, fontSize: 12 }}>{r.stock?.purchaseId || "—"}</td>
                <td style={td}>{r.stock?.supplierLocation || "—"}</td>
                <td style={td}>{r.sareeTypeName || "—"}</td>
                <td style={td}>{r.color || <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>}</td>
                <td style={td}>{r.stock?.weight || "—"}</td>
                <td style={td}>{fmtDate(r.stock?.purchaseDate)}</td>
                {canSeeMoney && (
                  <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12 }}>
                    {r.stock ? inr(r.stock.costPrice) : "—"}
                  </td>
                )}
                {canSeeMoney && (
                  <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12 }}>
                    {r.stock ? `${r.stock.sellPercent}%` : "—"}
                  </td>
                )}
                {canSeeMoney && (
                  <td style={{ ...td, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>
                    {r.stock ? inr(r.stock.finalAmount) : "—"}
                  </td>
                )}
              </tr>
            ))}
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
