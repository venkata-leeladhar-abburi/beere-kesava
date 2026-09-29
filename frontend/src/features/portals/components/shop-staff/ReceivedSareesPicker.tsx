import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { C, F, TEAL, Chip } from "./theme";
import { sareeTypeName, sareeTypeText } from "./stock-format";
import { inventoryApi, type ShopStockItem } from "../../../../shared/api/inventory";
import { Input } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

/**
 * New Sale's "Received at this shop" list — the pieces actually standing on
 * this shop's shelf. Reads the same `GET /inventory/shop` the Inventory tab
 * does (under the same query key, so a receipt or a sale refreshes both), which
 * only returns sarees the counter has receipted from a SHOP dispatch, plus
 * pieces restocked from a return. Sold pieces and anything already on this
 * bill are left out: this list is for picking, not for history.
 *
 * Ticking a row only selects its id — the basket line is still built by
 * NewSaleFlow's resolveLine, so a piece picked here is checked exactly like a
 * scanned one.
 */

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const dispatchLabel = (d: ShopStockItem["dispatch"]): string => {
  if (d.dispatchId === "RETURNED-STOCK") return "Returned stock";
  return d.lrNumber ? `LR ${d.lrNumber}` : `Dispatch ${fmtDate(d.dispatchDate)}`;
};

const ORIGIN_LABEL: Record<Exclude<ShopStockItem["stockOrigin"], "dispatch">, string> = {
  "retail-return": "Retail return",
  "wholesale-return": "Wholesale return",
};

/** Sellable pieces on this shop's shelf, for the source switch's count. */
export function useReceivedShopStock(inCart: ReadonlySet<string>) {
  const query = useQuery({
    queryKey: ["shop-stock"],
    queryFn: () => inventoryApi.shopStock(),
  });
  const available = useMemo(
    () => (query.data ?? []).filter(s => s.status === "available" && !inCart.has(s.sareeId)),
    [query.data, inCart],
  );
  return { ...query, available };
}

interface ReceivedSareesPickerProps {
  inCart: ReadonlySet<string>;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function ReceivedSareesPicker({ inCart, selectedIds, onSelectionChange }: ReceivedSareesPickerProps) {
  const [search, setSearch] = useState("");
  const { available, isLoading, isError, refetch } = useReceivedShopStock(inCart);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter(s =>
      s.sareeId.toLowerCase().includes(q)
      || sareeTypeText(s).toLowerCase().includes(q)
      || (s.weaverName ?? "").toLowerCase().includes(q)
      || (s.loomNumber ?? "").toLowerCase().includes(q)
      || (s.dispatch.lrNumber ?? "").toLowerCase().includes(q)
      || (s.color ?? "").toLowerCase().includes(q),
    );
  }, [available, search]);

  const columns = useMemo<ColumnDef<ShopStockItem>[]>(() => [
    {
      id: "sareeId", header: "Saree ID", type: "code", priority: 1, sortable: true,
      accessor: r => r.sareeId,
      cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{r.sareeId}</span>,
    },
    {
      id: "sareeType", header: "Saree Type", priority: 1, sortable: true,
      accessor: r => sareeTypeText(r),
      cell: (_v, r) => {
        const name = sareeTypeName(r);
        return (
          <span style={{ fontFamily: F.u, fontSize: 13.5, color: C.text, fontWeight: 600 }}>
            {r.sareeTypeCode ? <span style={{ fontFamily: F.m, color: C.burg }}>{r.sareeTypeCode}</span> : null}
            {r.sareeTypeCode && name ? <span style={{ color: C.muted }}> · </span> : null}
            {name ?? (r.sareeTypeCode ? null : "—")}
          </span>
        );
      },
    },
    {
      id: "weaver", header: "Weaver / Loom", priority: 2, sortable: true,
      accessor: r => r.weaverName ?? (r.loomNumber ? `Loom ${r.loomNumber}` : "—"),
      cell: (_v, r) => (
        <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
          {r.weaverName ?? "—"}
          {r.loomNumber ? <span style={{ color: TEAL, fontWeight: 600 }}> · Loom {r.loomNumber}</span> : null}
        </span>
      ),
    },
    {
      id: "retailPrice", header: "Retail Price", type: "currency", priority: 1, sortable: true,
      accessor: r => r.retailPrice,
      cell: (_v, r) => r.retailPrice != null
        ? <span style={{ fontFamily: F.m, fontWeight: 700, color: C.gold, fontVariantNumeric: "tabular-nums" }}>{formatMoney(rupees(r.retailPrice))}</span>
        : <span style={{ color: C.muted }} title="No retail price set on this saree type yet">—</span>,
    },
    {
      id: "dispatch", header: "Came in on", priority: 2, sortable: true,
      accessor: r => dispatchLabel(r.dispatch),
      cell: (_v, r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{dispatchLabel(r.dispatch)}</span>
          {r.stockOrigin !== "dispatch" && (
            <Chip
              label={ORIGIN_LABEL[r.stockOrigin]}
              color={r.stockOrigin === "retail-return" ? "#AB3832" : "#845E04"}
              bg={r.stockOrigin === "retail-return" ? "rgba(171,56,50,0.09)" : "rgba(200,155,71,0.14)"}
            />
          )}
        </span>
      ),
    },
    {
      id: "date", header: "Date", type: "date", priority: 3, sortable: true,
      accessor: r => r.dispatch.dispatchDate,
      cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13 }}>{fmtDate(r.dispatch.dispatchDate)}</span>,
    },
  ], []);

  // Search can hide rows that are still ticked; the table's select-all only
  // speaks for the rows it shows, so keep the hidden ticks when it fires.
  const handleSelectionChange = (next: Set<string>) => {
    const visible = new Set(rows.map(r => r.sareeId));
    const merged = new Set(next);
    selectedIds.forEach(id => { if (!visible.has(id)) merged.add(id); });
    onSelectionChange(merged);
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by Saree ID, saree type, weaver, loom or LR number"
          iconLeft={Search}
          aria-label="Search sarees received at this shop"
        />
      </div>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={r => r.sareeId}
        caption="Sarees received at this shop and available to sell"
        density="compact"
        responsive
        loading={isLoading}
        error={isError}
        onRetry={() => void refetch()}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        isFiltered={search.trim() !== ""}
        onClearFilters={() => setSearch("")}
        emptyTitle="No received sarees to sell"
        emptyDescription="Nothing received at this shop is unsold right now. Receive incoming consignments on the Inventory tab, or switch to All sarees."
        itemLabel="sarees"
      />
    </div>
  );
}
