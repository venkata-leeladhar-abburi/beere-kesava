import React from "react";
import { Eye, Edit2, Trash2, Tag } from "lucide-react";
import { Purchase, formatINR, purchaseTotals } from "../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../theme";
import { StatusPill } from "../common/primitives";
import { Button, IconButton } from "../../../../../shared/ui/primitives";

const COLUMNS = [
  "Serial Number",
  "Supplier Name",
  "Location",
  "Purchase Date",
  "Sarees",
  "GST Number",
  "Invoice Number",
  "Buying Price",
  "Selling Price",
  "Profit",
  "Bill Amount",
  "Payment Status",
  "Added By",
  "Actions",
];

/** Main purchases table with row actions (view / edit / delete) and pagination footer. */
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
  return (
    <div style={{ padding: "0 56px" }}>
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 2px 16px rgba(44,24,16,0.07)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.silkCream }}>
              {COLUMNS.map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: F.mono,
                    fontSize: 12,
                    color: T.taupe,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                onClick={() => onView(row)}
                onMouseEnter={() => setHoveredRow(row.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  borderBottom: `1px solid ${T.borderDef}`,
                  background: hoveredRow === row.id ? "#F0E8D0" : "white",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy }}>
                    {row.id}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                    {row.supplier}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                    {row.location}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                    {row.date}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    onClick={() => onViewSarees(row)}
                    variant="secondary"
                    size="sm"
                    iconLeft={Tag}
                    title="View / Print saree barcodes"
                    className="rounded-full"
                  >
                    {row.sareeCount}
                  </Button>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                    {row.gstNumber || "—"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>
                    {row.invoiceNumber || "—"}
                  </span>
                </td>
                {(() => {
                  const t = purchaseTotals(row.sarees);
                  return (
                    <>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{formatINR(t.buying)}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.antiqueGold, whiteSpace: "nowrap" }}>{formatINR(t.selling)}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green, whiteSpace: "nowrap" }}>{formatINR(t.profit)}</span>
                      </td>
                    </>
                  );
                })()}
                <td style={{ padding: "14px 16px" }}>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontWeight: 600,
                      fontSize: 13,
                      color: T.antiqueGold,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.billAmount}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <StatusPill status={row.status} />
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                    {row.addedBy || "—"}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      icon={Eye}
                      label="View"
                      onClick={() => onView(row)}
                      variant="ghost"
                      size="sm"
                      className="text-[var(--text-brand)]"
                    />
                    <IconButton
                      icon={Edit2}
                      label="Edit"
                      onClick={() => onEdit(row.id)}
                      variant="ghost"
                      size="sm"
                    />
                    <IconButton
                      icon={Trash2}
                      label="Delete"
                      onClick={() => onDelete(row.id)}
                      variant="ghost"
                      size="sm"
                      className="text-[var(--bk-red-700)] hover:text-[var(--bk-red-800)]"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={13}
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  No purchases match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
