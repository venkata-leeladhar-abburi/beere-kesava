import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageCheck, Truck } from "lucide-react";

import { C, F, Chip, SectionCard } from "./theme";
import { ReceiveDispatchModal, consignmentLabel } from "./ReceiveDispatchModal";
import {
  shopReceiptsApi,
  shopReceiptKeys,
  type PendingShopDispatch,
} from "../../../../shared/api/shop-receipts";
import { Button } from "../../../../shared/ui/primitives";
import { EntityCode } from "../../../../shared/ui/domain";
import { DataTable, ViewToggle, type ColumnDef, type DataView } from "../../../../shared/ui/data";

/**
 * Consignments the factory has dispatched to this shop that nobody at the
 * counter has receipted yet. Nothing on this list is shop stock: a saree only
 * reaches the Inventory table and the New Sale picker once it has been
 * received here (InventoryService.findShopStock filters on exactly that), so
 * this section is the gate between "sent" and "sellable".
 *
 * A partially received consignment stays on the list with the pieces that were
 * short, so chasing a shortage is the same action as the first receipt.
 */

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * How many consignments are waiting to be received. Drives the count badge on
 * the Inventory tab in both navs — an unreceived consignment is invisible
 * everywhere else in the portal (it is not stock yet), so without the badge
 * the only prompt to act is the notification that may already be read.
 */
export function usePendingShopDispatchCount(): number {
  const { data } = useQuery({
    queryKey: shopReceiptKeys.pending,
    queryFn: () => shopReceiptsApi.listPending(),
  });
  return data?.length ?? 0;
}

const awaiting = (d: PendingShopDispatch): number =>
  d.sarees.filter(s => s.receiptStatus === null || s.receiptStatus === "MISSING").length;

export function IncomingDispatchSection() {
  const [receiving, setReceiving] = useState<PendingShopDispatch | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [dataView, setDataView] = useState<DataView>("table");

  const columns: ColumnDef<PendingShopDispatch>[] = [
    {
      id: "consignment", header: "Consignment", priority: 1, sortable: true,
      accessor: d => consignmentLabel(d),
      cell: (_v, d) => (
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
          <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{consignmentLabel(d)}</span>
          {d.receiptStatus === "PARTIALLY_RECEIVED" && (
            <Chip label="Partly received" color="#845E04" bg="rgba(200,155,71,0.18)" />
          )}
        </span>
      ),
    },
    {
      id: "awaiting", header: "Awaiting", type: "text", priority: 1, sortable: true,
      accessor: d => awaiting(d),
      cell: (_v, d) => (
        <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
          {awaiting(d)} of {d.sarees.length} saree(s)
        </span>
      ),
    },
    {
      id: "dispatched", header: "Dispatched", type: "date", priority: 2, sortable: true,
      accessor: d => d.dispatchDate,
      cell: (_v, d) => <span style={{ fontFamily: F.u, fontSize: 13 }}>{fmtDate(d.dispatchDate)}</span>,
    },
    {
      id: "dispatchedBy", header: "Dispatched by", priority: 3,
      accessor: d => d.dispatchedBy ? `${d.dispatchedBy.firstName} ${d.dispatchedBy.lastName}`.trim() : "—",
    },
    {
      id: "transport", header: "Transport", priority: 3,
      accessor: d => [d.lrNumber ? `LR ${d.lrNumber}` : null, d.transportCompany].filter(Boolean).join(" · ") || "—",
    },
    {
      id: "actions", header: "Actions", type: "actions", accessor: () => null,
      cell: (_v, d) => (
        <Button variant="primary" size="md" iconLeft={PackageCheck} onClick={() => setReceiving(d)}>
          Receive
        </Button>
      ),
    },
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: shopReceiptKeys.pending,
    queryFn: () => shopReceiptsApi.listPending(),
  });
  const pending = data ?? [];

  return (
    <div style={{ margin: "0 20px" }}>
      <SectionCard
        icon={Truck}
        title="Incoming consignments"
        subtitle="Sarees dispatched to this shop, waiting to be received at the counter"
        bodyPadding="20px"
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {pending.length > 0 && (
              <Chip label={`${pending.length} to receive`} color="#845E04" bg="rgba(200,155,71,0.18)" />
            )}
            <ViewToggle value={dataView} onChange={setDataView} />
          </div>
        }
      >
        {confirmed && (
          <div
            role="status"
            style={{
              display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 14,
              fontFamily: F.u, fontSize: 13, color: "#0F766E",
              background: "rgba(15,118,110,0.08)", border: "1px solid rgba(15,118,110,0.22)",
              borderRadius: 10, padding: "10px 12px",
            }}
          >
            <PackageCheck size={15} />
            <span>Receipt</span>
            <EntityCode type="shopReceipt" value={confirmed} size="sm" copyable />
            <span>recorded. Received sarees are now in shop stock.</span>
          </div>
        )}

        <DataTable
          columns={columns}
          data={pending}
          getRowId={d => d.id}
          caption="Consignments awaiting receipt at this shop"
          view={dataView}
          density="compact"
          loading={isLoading}
          error={isError}
          onRetry={() => void refetch()}
          emptyTitle="Nothing waiting"
          emptyDescription="Every consignment sent to this shop has been received."
        />
      </SectionCard>

      {receiving && (
        <ReceiveDispatchModal
          dispatch={receiving}
          open
          onClose={() => setReceiving(null)}
          onReceived={code => setConfirmed(code)}
        />
      )}
    </div>
  );
}
