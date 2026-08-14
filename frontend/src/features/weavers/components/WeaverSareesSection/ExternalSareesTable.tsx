import React from "react";
import { Pagination, UsePaginationReturn } from "../../../../shared/ui/DataPagination";
import { T } from "./theme";
import { WeaverSareeRow } from "./types";
import { inr, fmtDate, externalSerialOf } from "./utils";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

interface ExternalSareesTableProps {
  pageRows: WeaverSareeRow[];
  canSeeMoney: boolean;
  pag: UsePaginationReturn;
}

export function ExternalSareesTable({ pageRows, canSeeMoney, pag }: ExternalSareesTableProps) {
  const columns: ColumnDef<WeaverSareeRow>[] = [
    {
      id: "sareeId", header: "Saree ID", accessor: r => r.sareeId, type: "code", priority: 1,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, whiteSpace: "nowrap" as const }}>{r.sareeId}</span>,
    },
    {
      id: "serialNo", header: "Serial No.", accessor: r => externalSerialOf(r.sareeId), priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.luxuryBrown }}>{externalSerialOf(r.sareeId) || "—"}</span>,
    },
    {
      id: "supplier", header: "Supplier", accessor: r => r.stock?.supplier,
      cell: (_v, r) => <span style={{ fontWeight: 600, color: T.royalBurgundy }}>{r.stock?.supplier || "—"}</span>,
    },
    {
      id: "purchaseOrder", header: "Purchase Order", accessor: r => r.stock?.purchaseId, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.stock?.purchaseId || "—"}</span>,
    },
    { id: "location", header: "Location", accessor: r => r.stock?.supplierLocation ?? "—", priority: 3 },
    { id: "sareeType", header: "Saree Type", accessor: r => r.sareeTypeName ?? "—" },
    {
      id: "colour", header: "Colour", accessor: r => r.color,
      cell: (_v, r) => r.color ? <>{r.color}</> : <span style={{ color: "rgba(139,112,96,0.45)" }}>—</span>,
    },
    { id: "weight", header: "Weight", accessor: r => r.stock?.weight ?? "—", priority: 3 },
    {
      id: "purchaseDate", header: "Purchase Date", accessor: r => r.stock?.purchaseDate, priority: 3,
      cell: (_v, r) => <>{fmtDate(r.stock?.purchaseDate)}</>,
    },
    ...(canSeeMoney ? [
      {
        id: "costPrice", header: "Cost Price", accessor: r => r.stock?.costPrice, align: "end",
        cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.stock ? inr(r.stock.costPrice) : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
      {
        id: "sellPercent", header: "Sell %", accessor: r => r.stock?.sellPercent, align: "end",
        cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.stock ? `${r.stock.sellPercent}%` : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
      {
        id: "finalAmount", header: "Final Amount", accessor: r => r.stock?.finalAmount, align: "end",
        cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{r.stock ? inr(r.stock.finalAmount) : "—"}</span>,
      } as ColumnDef<WeaverSareeRow>,
    ] : []),
  ];

  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <DataTable responsive columns={columns} data={pageRows} getRowId={r => r.sareeId} />
      </div>
      <div style={{ padding: "0 14px" }}>
        <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="sarees" />
      </div>
    </div>
  );
}
