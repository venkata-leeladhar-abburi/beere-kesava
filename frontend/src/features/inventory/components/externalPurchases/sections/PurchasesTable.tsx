import React from "react";
import { Eye, Edit2, Trash2, Tag } from "lucide-react";
import { Purchase, purchaseTotals } from "../../../../suppliers/contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { T, F } from "../theme";
import { StatusPill } from "../common/primitives";
import { Button, IconButton } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";

/**
 * Migrated onto <DataTable> — design-system/04-DATA-DISPLAY.md Part S, Step 3
 * ("migrate one feature end-to-end as proof"). Every cell keeps its original
 * font/colour/format exactly via a `cell` override; the only intended visual
 * change is the header row, which now uses the corrected spec (12px Inter
 * 600 --text-tertiary on --surface-sunken, was 12px MONO on taupe #69635E
 * with a fixed 1.5px letter-spacing) — Part D.2 applied for real.
 */
export function PurchasesTable({
  filtered,
  totalCount,
  hoveredRow,
  setHoveredRow,
  onView,
  onViewSarees,
  onEdit,
  onDelete,
}: {
  filtered: Purchase[];
  totalCount: number;
  hoveredRow: string | null;
  setHoveredRow: (id: string | null) => void;
  onView: (row: Purchase) => void;
  onViewSarees: (row: Purchase) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const mono = (color: string, extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: F.mono, fontSize: 12, color, whiteSpace: "nowrap", ...extra,
  });

  const columns: ColumnDef<Purchase>[] = [
    {
      id: "serial", header: "Serial Number", accessor: row => row.id,
      cell: (_v, row) => <span style={mono(T.royalBurgundy, { fontWeight: 700 })}>{row.id}</span>,
    },
    {
      id: "supplier", header: "Supplier Name", accessor: row => row.supplier,
      cell: (_v, row) => <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>{row.supplier}</span>,
    },
    {
      id: "location", header: "Location", accessor: row => row.location,
      cell: (_v, row) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{row.location}</span>,
    },
    {
      id: "date", header: "Purchase Date", accessor: row => row.date,
      cell: (_v, row) => <span style={mono(T.taupe)}>{row.date}</span>,
    },
    {
      id: "sarees", header: "Sarees", accessor: row => row.sareeCount,
      cell: (_v, row) => (
        <div onClick={e => e.stopPropagation()}>
          <Button onClick={() => onViewSarees(row)} variant="secondary" size="sm" iconLeft={Tag} title="View / Print saree barcodes" className="rounded-full">
            {row.sareeCount}
          </Button>
        </div>
      ),
    },
    {
      id: "gst", header: "GST Number", accessor: row => row.gstNumber,
      cell: (_v, row) => <span style={mono(T.taupe)}>{row.gstNumber || "—"}</span>,
    },
    {
      id: "invoice", header: "Invoice Number", accessor: row => row.invoiceNumber,
      cell: (_v, row) => <span style={mono(T.taupe)}>{row.invoiceNumber || "—"}</span>,
    },
    {
      id: "buying", header: "Buying Price", accessor: row => purchaseTotals(row.sarees).buying, type: "number", sortable: true,
      cell: (_v, row) => <span style={mono(T.luxuryBrown)}>{formatMoney(rupees(purchaseTotals(row.sarees).buying))}</span>,
    },
    {
      id: "selling", header: "Selling Price", accessor: row => purchaseTotals(row.sarees).selling, type: "number", sortable: true,
      cell: (_v, row) => <span style={mono(T.antiqueGold, { fontWeight: 600 })}>{formatMoney(rupees(purchaseTotals(row.sarees).selling))}</span>,
    },
    {
      id: "profit", header: "Profit", accessor: row => purchaseTotals(row.sarees).profit, type: "number", sortable: true,
      cell: (_v, row) => <span style={mono(T.green, { fontWeight: 700 })}>{formatMoney(rupees(purchaseTotals(row.sarees).profit))}</span>,
    },
    {
      id: "billAmount", header: "Bill Amount", accessor: row => row.billAmount,
      cell: (_v, row) => <span style={mono(T.antiqueGold, { fontWeight: 600, fontSize: 13 })}>{row.billAmount}</span>,
    },
    {
      id: "status", header: "Payment Status", accessor: row => row.status, type: "status",
      cell: (_v, row) => <StatusPill status={row.status} />,
    },
    {
      id: "addedBy", header: "Added By", accessor: row => row.addedBy,
      cell: (_v, row) => <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>{row.addedBy || "—"}</span>,
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions",
      cell: (_v, row) => (
        <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
          <IconButton icon={Eye} label="View" onClick={() => onView(row)} variant="ghost" size="sm" className="text-[var(--text-brand)]" />
          <IconButton icon={Edit2} label="Edit" onClick={() => onEdit(row.id)} variant="ghost" size="sm" />
          <IconButton icon={Trash2} label="Delete" onClick={() => onDelete(row.id)} variant="ghost" size="sm" className="text-[var(--bk-red-700)] hover:text-[var(--bk-red-800)]" />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 56px" }}>
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 2px 16px rgba(44,24,16,0.07)",
          overflow: "hidden",
        }}
      >
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={row => row.id}
          onRowClick={onView}
          rowClassName={row => (hoveredRow === row.id ? "bk-purchases-row-hovered" : undefined)}
          isFiltered={totalCount !== filtered.length}
          onClearFilters={() => {}}
          emptyTitle={totalCount === 0 ? "No external purchases recorded yet" : "No purchases match your filters"}
        />
        <style>{`.bk-purchases-row-hovered { background: #F0E8D0 !important; }`}</style>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${T.borderDef}`,
            padding: "12px 20px",
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
            Showing 1–{filtered.length} of {totalCount} entries
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {["← Previous", "1", "Next →"].map((p, i) => (
              <Button
                key={i}
                variant={p === "1" ? "secondary" : "ghost"}
                size="sm"
                className="shadow-none"
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
