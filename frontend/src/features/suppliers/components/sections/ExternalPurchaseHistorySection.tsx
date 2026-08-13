// Flat "External Purchase History" table shown at the bottom of the main
// Suppliers page (all purchases, across all suppliers).

import React, { useMemo, useState } from "react";
import { History } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SectionCard } from "../common/primitives";
import { Purchase } from "../../contexts/SupplierContext";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";

export function ExternalPurchaseHistorySection({ purchases }: { purchases: Purchase[] }) {
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const filtered = useMemo(() => purchases.filter(p => matchesDateFilter(p.date, filter)), [purchases, filter]);

  const columns: ColumnDef<Purchase>[] = [
    {
      id: "id", header: "Purchase Ref", accessor: p => p.id, priority: 1,
      cell: (_v, p) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{p.id}</span>,
    },
    {
      id: "supplier", header: "Supplier", accessor: p => p.supplier,
      cell: (_v, p) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{p.supplier}</span>,
    },
    {
      id: "invoice", header: "Invoice", accessor: p => p.invoiceNumber, priority: 3,
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
      id: "date", header: "Date", accessor: p => p.date, priority: 3,
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
      <SectionCard
        icon={History}
        title="External Purchase History"
        subtitle="Every raw-material purchase recorded from every supplier, with bill status and invoice reference."
      >
        <div style={{ marginBottom: 20 }}>
          <DateFilterBar filter={filter} onChange={setFilter} />
        </div>
        <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
          <DataTable
            responsive
            columns={columns}
            data={filtered}
            getRowId={p => p.id}
            emptyTitle="No external purchases recorded in this period"
          />
        </div>
      </SectionCard>
      </FadeUp>
    </div>
  );
}
