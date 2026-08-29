import React, { useMemo, useState } from "react";
import { History, LayoutGrid, List } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SectionCard } from "../common/primitives";
import { Button } from "../../../../shared/ui/primitives";
import { Purchase } from "../../contexts/SupplierContext";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";

export function ExternalPurchaseHistorySection({ purchases }: { purchases: Purchase[] }) {
  const [filter, setFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const filtered = useMemo(() => purchases.filter(p => matchesDateFilter(p.date, filter)), [purchases, filter]);

  const columns: ColumnDef<Purchase>[] = [
    {
      id: "id", header: "Purchase Ref", accessor: p => p.id, priority: 1,
      cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{p.id}</span>,
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
      cell: (_v, p) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "#8B6018" }}>{p.billAmount}</span>,
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
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <FadeUp>
      <SectionCard
        icon={History}
        title="External Purchase History"
        subtitle="Every raw-material purchase recorded from every supplier, with bill status and invoice reference."
      >
        <div style={{ marginBottom: 16 }}>
          <DateFilterBar filter={filter} onChange={setFilter} />
        </div>

        <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0 mb-4 w-fit">
          <Button
            onClick={() => setViewMode("card")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              viewMode === "card"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
            }`}
          >
            <LayoutGrid size={14} /> Card View
          </Button>
          <Button
            onClick={() => setViewMode("table")}
            variant="ghost"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
              viewMode === "table"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
                : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
            }`}
          >
            <List size={14} /> Table View
          </Button>
        </div>
        <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
          <DataTable
            responsive={viewMode === "card"}
            columns={columns}
            data={filtered}
            getRowId={p => p.id}
            pagination
            emptyTitle="No external purchases recorded in this period"
          />
        </div>
      </SectionCard>
      </FadeUp>
    </div>
  );
}
