import { Eye, ShoppingBag } from "lucide-react";
import { BulkOrder } from "@/features/bulk-orders";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { OrderMoney } from "@/features/bulk-orders";
import { T, F } from "../../theme";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

const ORDER_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  "on-track": { label: "On Track", color: T.green, bg: T.greenBg },
  "at-risk": { label: "At Risk", color: "#8B6018", bg: "rgba(200,155,71,0.14)" },
  "overdue": { label: "Overdue", color: T.crimson, bg: T.crimsonBg },
};
const PAY_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: T.green, bg: T.greenBg },
  partial: { label: "Partial", color: "#8B6018", bg: "rgba(200,155,71,0.14)" },
  pending: { label: "Pending", color: T.crimson, bg: T.crimsonBg },
};
const inr = (n: number) => formatMoney(rupees(n));

export interface OrderHistoryTabProps {
  custOrders: BulkOrder[];
  custOrderMoney: Map<string, OrderMoney>;
  wholesaleOrderDateFilter: DateFilterState;
  setWholesaleOrderDateFilter: (f: DateFilterState) => void;
  onViewBulkOrder: (order: BulkOrder, tab: "overview" | "sarees" | "payments" | "quotations") => void;
}

export function OrderHistoryTab({
  custOrders, custOrderMoney, wholesaleOrderDateFilter, setWholesaleOrderDateFilter, onViewBulkOrder,
}: OrderHistoryTabProps) {
  const rows = custOrders.filter(o => matchesDateFilter(o.due, wholesaleOrderDateFilter));
  const rowsOrdered = rows.reduce((a, o) => a + o.total, 0);
  const rowsDone = rows.reduce((a, o) => a + o.done, 0);
  const rowsValue = rows.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.amountDue ?? 0), 0);
  const rowsDue = rows.reduce((a, o) => a + (custOrderMoney.get(o.ref)?.balance ?? 0), 0);

  const columns: ColumnDef<BulkOrder>[] = [
    {
      id: "ref", header: "Order Ref", accessor: o => o.ref, priority: 1,
      cell: (_v, o) => (
        <>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, fontWeight: 700 }}>{o.ref}</span>
          {o.tallied && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 3 }}>✓ Tallied</div>}
        </>
      ),
    },
    {
      id: "deadline", header: "Deadline", accessor: o => o.due, priority: 3,
      cell: (_v, o) => <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{o.due}</span>,
    },
    {
      id: "sareeType", header: "Saree Type / Design", accessor: o => o.sareeType, priority: 3,
      cell: (_v, o) => (
        <>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{o.sareeType}</span>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 2 }}>{o.design}</div>
        </>
      ),
    },
    {
      id: "progress", header: "Progress", accessor: o => o.done,
      cell: (_v, o) => {
        const pct = o.total ? Math.round((o.done / o.total) * 100) : 0;
        const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META["on-track"];
        return (
          <div style={{ minWidth: 130 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.luxuryBrown, marginBottom: 5 }}>{o.done}/{o.total} · {pct}%</div>
            <div style={{ height: 6, background: T.silkCream, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: meta.color, borderRadius: 4 }} />
            </div>
            {(o.shortage ?? 0) > 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, marginTop: 4 }}>Shortage {o.shortage}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "orderValue", header: "Order Value", accessor: o => custOrderMoney.get(o.ref)?.amountDue ?? 0,
      cell: (_v, o) => {
        const m = custOrderMoney.get(o.ref)!;
        return <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.antiqueGold }}>{m.amountDue ? inr(m.amountDue) : "—"}</span>;
      },
    },
    {
      id: "outstanding", header: "Outstanding", accessor: o => custOrderMoney.get(o.ref)?.balance ?? 0,
      cell: (_v, o) => {
        const m = custOrderMoney.get(o.ref)!;
        return <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: m.balance > 0 ? T.crimson : T.taupe }}>{m.balance > 0 ? inr(m.balance) : "—"}</span>;
      },
    },
    {
      id: "status", header: "Status", accessor: o => o.status, type: "status",
      cell: (_v, o) => {
        const meta = ORDER_STATUS_META[o.status] ?? ORDER_STATUS_META["on-track"];
        return <span style={{ background: meta.bg, color: meta.color, padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" as const }}>{meta.label}</span>;
      },
    },
    {
      id: "payment", header: "Payment", accessor: o => o.paymentStatus, type: "status",
      cell: (_v, o) => {
        const pay = PAY_STATUS_META[o.paymentStatus ?? "pending"];
        return <span style={{ background: pay.bg, color: pay.color, padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{pay.label}</span>;
      },
    },
    {
      id: "actions", header: "", accessor: () => null, type: "actions",
      cell: (_v, o) => (
        <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap" as const }}>
          <Button onClick={() => onViewBulkOrder(o, "overview")} variant="secondary" size="sm" iconLeft={Eye}>
            View Order
          </Button>
          <Button onClick={() => onViewBulkOrder(o, "sarees")} variant="tertiary" size="sm" iconLeft={ShoppingBag}>
            Sarees
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0 }}>Bulk Order History</h3>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {[
            { label: "ORDERS", value: String(rows.length) },
            { label: "SAREES", value: `${rowsDone}/${rowsOrdered}` },
            { label: "ORDER VALUE", value: inr(rowsValue) },
            { label: "OUTSTANDING", value: inr(rowsDue) },
          ].map(k => (
            <div key={k.label}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: T.taupe }}>{k.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>
      <DateFilterBar filter={wholesaleOrderDateFilter} onChange={setWholesaleOrderDateFilter} />
      {rows.length === 0 ? (
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
          {custOrders.length === 0
            ? "No bulk orders have been created for this customer yet."
            : "No bulk orders fall in this period. Widen the timeline to see more."}
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
          <DataTable responsive columns={columns} data={rows} getRowId={o => o.ref} />
        </div>
      )}
    </div>
  );
}
