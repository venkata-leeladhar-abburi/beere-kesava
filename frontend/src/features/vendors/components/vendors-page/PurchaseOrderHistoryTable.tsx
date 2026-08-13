import React from "react";
import { T, F } from "./theme";
import { MAT_TAG_PO } from "./data";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

export function PurchaseOrderHistoryTable({ orders }: { orders: any[] }) {
  const columns: ColumnDef<any>[] = [
    {
      id: "po", header: "PO Reference", accessor: o => o.id, priority: 1,
      cell: (_v, o) => (
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>{o.id}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{o.date}</div>
        </div>
      ),
    },
    {
      id: "materials", header: "Materials", accessor: o => o.materials,
      cell: (_v, o) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {o.materials.map((m: any, mi: number) => {
            const mt = MAT_TAG_PO[m.type] || MAT_TAG_PO.Warp;
            return (
              <div key={mi} style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 6, borderBottom: mi < o.materials.length - 1 ? `1px solid ${T.borderDef}` : "none" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: mt.col, background: mt.bg, borderRadius: 4, padding: "2px 6px", marginTop: 1 }}>{m.type}</span>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{m.description}</span>
                  {m.invoiceAmount && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice: <span style={{ fontFamily: F.mono, fontWeight: 600 }}>{m.invoiceAmount}</span></span>}
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 6px", borderRadius: 4, marginTop: 1 }}>{m.qty}</span>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "total", header: "Total Value", accessor: o => o.totalAmount, type: "currency",
      cell: (_v, o) => <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: "#8B6018" }}>{o.totalAmount}</span>,
    },
    {
      id: "receipt", header: "Receipt Details", accessor: o => o.grnId, priority: 3,
      cell: (_v, o) => o.grnId ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{o.grnId}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{o.firmName}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{o.receivedDate}</div>
        </div>
      ) : (
        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</div>
      ),
    },
    {
      id: "status", header: "Status", accessor: o => o.status, type: "status",
      cell: (_v, o) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: o.status === "Delivered" ? T.greenBg : T.silkCream, color: o.status === "Delivered" ? T.greenMid : T.taupe, padding: "3px 8px", borderRadius: 6 }}>{o.status}</span>
          {o.receiveStatus && (
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: o.receiveStatus === "Match" ? T.greenBg : "rgba(242,153,74,0.15)", color: o.receiveStatus === "Match" ? T.greenMid : "#E67E22", padding: "2px 6px", borderRadius: 4 }}>
              {o.receiveStatus}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      responsive
      columns={columns}
      data={orders}
      getRowId={o => o.id}
      emptyTitle="No purchase orders yet"
    />
  );
}
