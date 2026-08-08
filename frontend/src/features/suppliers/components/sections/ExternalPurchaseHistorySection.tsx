// Flat "External Purchase History" table shown at the bottom of the main
// Suppliers page (all purchases, across all suppliers).

import React from "react";
import { T, F } from "../theme";
import { FadeUp } from "../common/primitives";
import { Purchase } from "../../contexts/SupplierContext";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

export function ExternalPurchaseHistorySection({ purchases }: { purchases: Purchase[] }) {
  const columns: ColumnDef<Purchase>[] = [
    {
      id: "id", header: "Purchase Ref", accessor: p => p.id,
      cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{p.id}</span>,
    },
    {
      id: "supplier", header: "Supplier", accessor: p => p.supplier,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{p.supplier}</span>,
    },
    {
      id: "invoice", header: "Invoice", accessor: p => p.invoiceNumber,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.invoiceNumber || "—"}</span>,
    },
    {
      id: "sarees", header: "Sarees", accessor: p => p.sareeCount,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.sareeCount} pcs</span>,
    },
    {
      id: "bill", header: "Bill Amount", accessor: p => p.billAmount,
      cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#8B6018" }}>{p.billAmount}</span>,
    },
    {
      id: "date", header: "Date", accessor: p => p.date,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</span>,
    },
    {
      id: "status", header: "Status", accessor: p => p.status, type: "status",
      cell: (_v, p) => (
        <span style={{
          fontFamily: F.ui, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          background: p.status === "Paid" ? "rgba(30,102,64,0.09)" : "rgba(230,126,34,0.12)",
          color: p.status === "Paid" ? T.greenMid : "rgba(230,126,34,1)",
        }}>{p.status}</span>
      ),
    },
  ];

  return (
    <div style={{ padding: "48px 56px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>External Purchase History</h2>
        </div>
        <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
          <DataTable
            columns={columns}
            data={purchases}
            getRowId={p => p.id}
            emptyTitle="No external purchases recorded yet"
          />
        </div>
      </FadeUp>
    </div>
  );
}
