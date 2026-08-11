// Purchase (order) history table with saree drill-down, used by the Order
// History tab of a supplier's profile.

import { useState } from "react";
import { T, F } from "../theme";
import { PayStatusPill } from "../common/primitives";
import { SareeInventoryTable } from "./SareeInventoryTable";
import { Purchase, purchaseTotals } from "../../contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { FileText } from "lucide-react";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

export function PurchaseHistoryTable({ purchases }: { purchases: Purchase[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const columns: ColumnDef<Purchase>[] = [
    {
      id: "ref", header: "Purchase Ref", accessor: p => p.id,
      cell: (_v, p) => (
        <>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>{p.id}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</div>
        </>
      ),
    },
    {
      id: "invoice", header: "Invoice", accessor: p => p.invoiceNumber,
      cell: (_v, p) => (
        <>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{p.invoiceNumber || "—"}</div>
          {p.invoiceFileName && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              <FileText size={11} color={T.royalBurgundy} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.invoiceFileName}</span>
            </div>
          )}
        </>
      ),
    },
    {
      id: "sarees", header: "Sarees", accessor: p => p.sareeCount,
      cell: v => <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{v as number}</span>,
    },
    {
      id: "buying", header: "Buying Price", accessor: p => purchaseTotals(p.sarees).buying,
      cell: v => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{formatMoney(rupees(v as number))}</span>,
    },
    {
      id: "selling", header: "Selling Price", accessor: p => purchaseTotals(p.sarees).selling,
      cell: v => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.antiqueGold, whiteSpace: "nowrap" }}>{formatMoney(rupees(v as number))}</span>,
    },
    {
      id: "profit", header: "Profit", accessor: p => purchaseTotals(p.sarees).profit,
      cell: v => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green, whiteSpace: "nowrap" }}>{formatMoney(rupees(v as number))}</span>,
    },
    {
      id: "billAmount", header: "Bill Amount", accessor: p => p.billAmount,
      cell: v => <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: "#8B6018" }}>{v as string}</span>,
    },
    {
      id: "payment", header: "Payment", accessor: p => p.status,
      cell: (_v, p) => <PayStatusPill status={p.status} />,
    },
    {
      id: "expand", header: "", align: "end", accessor: () => null,
      cell: (_v, p) => (
        <Button variant="tertiary" size="sm" onClick={() => toggle(p.id)}>
          {expandedIds.has(p.id) ? "Hide sarees" : `View ${p.sareeCount} sarees`}
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={purchases}
      getRowId={p => p.id}
      expandedIds={expandedIds}
      renderExpandedRow={p => (
        <div style={{ padding: "6px 16px 16px", background: "rgba(247,242,234,0.7)" }}>
          <SareeInventoryTable rows={p.sarees.map(s => ({ ...s, purchaseId: p.id, invoiceNumber: p.invoiceNumber, supplier: p.supplier }))} />
        </div>
      )}
      emptyTitle="No purchases in this period."
    />
  );
}
