/**
 * Retail-sale table columns, shared by the firm's Retail Sales tab and the
 * "Connect Retail Sales" picker.
 * ═══════════════════════════════════════════════════════════════════════════
 * Deliberately mirrors the Shop Staff sales report
 * (features/portals/components/shop-staff/reportColumns.tsx) — an accountant
 * reconciling a firm's books against the shop's report should be reading the
 * same columns in the same order, or the two screens invite mis-matching.
 *
 * `priority` drives DataTable's card fallback below `md`: 1 is the card title,
 * 2 becomes a label/value pair, 3 is hidden on small screens.
 */
import React from "react";
import { Trash2 } from "lucide-react";
import type { ColumnDef } from "../../../../shared/ui/data";
import { IconButton } from "../../../../shared/ui/primitives";
import type { FirmRetailSale } from "../../../../shared/api/firms";
import { T, F } from "../theme";

export function actorName(actor: FirmRetailSale["soldBy"]): string | null {
  if (!actor) return null;
  return `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim() || null;
}

export function customerName(sale: FirmRetailSale): string {
  return sale.customer?.name ?? (sale.customerId ? `Customer ${sale.customerId.slice(0, 6)}` : "Walk-in Customer");
}

/** "upi" → "Upi", "bank_transfer" → "Bank Transfer", null → "Counter". */
export function paymentLabel(method: string | null | undefined): string {
  if (!method) return "Counter";
  return method
    .toLowerCase()
    .split(/[\s_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const snoColumn = <T,>(): ColumnDef<T> => ({
  id: "sno", header: "S.No.", accessor: () => "", type: "number", width: 70, sortable: false, priority: 3,
  cell: (_v, _r, index) => (
    <span style={{ fontFamily: F.ui, color: "var(--text-tertiary)" }}>{index + 1}</span>
  ),
});

const baseColumns = (): ColumnDef<FirmRetailSale>[] => [
  snoColumn<FirmRetailSale>(),
  { id: "saleRef", header: "Sale Ref", accessor: r => r.saleRef, type: "code", width: 160, sortable: true, priority: 1 },
  { id: "saree", header: "Saree ID", accessor: r => r.sareeId, type: "code", width: 190, sortable: true, priority: 2 },
  { id: "date", header: "Date & Time", accessor: r => new Date(r.saleDate), type: "datetime", width: 205, sortable: true, priority: 2 },
  { id: "customer", header: "Customer", accessor: r => customerName(r), type: "text", sortable: true, priority: 2 },
  { id: "pay", header: "Payment", accessor: r => paymentLabel(r.paymentMethod), type: "text", width: 130, sortable: true, priority: 2 },
  { id: "payRef", header: "Payment Ref", accessor: r => r.paymentRef ?? "—", type: "text", width: 150, sortable: true, priority: 3 },
  { id: "soldBy", header: "Sold by", accessor: r => actorName(r.soldBy) ?? "—", type: "text", width: 150, sortable: true, priority: 3 },
  {
    id: "amount", header: "Amount", accessor: r => Number(r.amount) || 0,
    type: "currency", align: "end", width: 150, sortable: true, priority: 2,
  },
];

/** Columns for the firm's own Retail Sales tab — adds who connected it, and
 *  a disconnect action when the viewer is allowed to change the books. */
export function firmRetailSaleColumns(
  onUnlink?: (sale: FirmRetailSale) => void,
  isUnlinking?: boolean,
): ColumnDef<FirmRetailSale>[] {
  return [
    ...baseColumns(),
    {
      id: "linkedHow", header: "Booked", accessor: r => (r.firmLinkedAuto ? "Automatically" : "Manually"),
      type: "text", width: 130, sortable: true, priority: 3,
      cell: (_v, r) => (
        <span style={{
          fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap",
          borderRadius: 999, padding: "3px 10px", display: "inline-block",
          color: r.firmLinkedAuto ? T.green : T.antiqueGold,
          background: r.firmLinkedAuto ? "rgba(30,102,64,0.10)" : T.bgGold,
          border: `1px solid ${r.firmLinkedAuto ? "rgba(30,102,64,0.22)" : T.borderGold}`,
        }}>
          {r.firmLinkedAuto ? "Automatic" : "Manual"}
        </span>
      ),
    },
    {
      id: "linkedBy", header: "Connected by", accessor: r => actorName(r.firmLinkedBy) ?? "—",
      type: "text", width: 170, sortable: true, priority: 3,
      cell: (_v, r) => (
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{actorName(r.firmLinkedBy) ?? "—"}</div>
          {r.firmLinkedAt && (
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>
              {new Date(r.firmLinkedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          )}
        </div>
      ),
    },
    { id: "note", header: "Note", accessor: r => r.firmLinkNote ?? "—", type: "text", width: 180, sortable: false, priority: 3 },
    ...(onUnlink
      ? [{
          id: "actions", header: "", accessor: () => "", type: "text" as const, width: 64,
          sortable: false, align: "center" as const, priority: 3 as const,
          cell: (_v: unknown, r: FirmRetailSale) => (
            <IconButton
              label={`Disconnect sale ${r.saleRef} from this firm`}
              icon={Trash2}
              variant="ghost"
              disabled={isUnlinking}
              onClick={e => { e.stopPropagation(); onUnlink(r); }}
            />
          ),
        }]
      : []),
  ];
}

/** Columns for the connect picker — shows which firm a sale is already on, so
 *  the user knows a re-link will MOVE it rather than add a second booking. */
export function connectableRetailSaleColumns(): ColumnDef<FirmRetailSale>[] {
  return [
    ...baseColumns(),
    {
      id: "currentFirm", header: "Current Firm", accessor: r => r.firm?.firmName ?? "Unconnected",
      type: "text", width: 190, sortable: true, priority: 2,
      cell: (_v, r) => (
        r.firm
          ? (
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.antiqueGold, background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 999, padding: "3px 10px", display: "inline-block", whiteSpace: "nowrap" }}>
              {r.firm.firmName}
            </span>
          )
          : <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Unconnected</span>
      ),
    },
  ];
}
