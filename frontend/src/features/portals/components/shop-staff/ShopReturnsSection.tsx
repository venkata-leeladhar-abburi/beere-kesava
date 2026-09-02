import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Printer, PackageCheck, RotateCcw, Building2, ShoppingBag, Camera, CheckCircle2, Search, X,
} from "lucide-react";

import { C, F, Chip, SectionCard } from "./theme";
import { salesApi, type ReturnStockItem } from "../../../../shared/api/sales";
import { resolveAssetUrl } from "../../../../shared/api/uploads";
import { Button, IconButton, Input, MultiSelect } from "../../../../shared/ui/primitives";
import { DataTable, ViewToggle, type ColumnDef, type DataView } from "../../../../shared/ui/data";
import { LoadingState, ErrorState, EmptyState } from "../../../../shared/ui/state";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";
import { DateFilterBar, DEFAULT_DATE_FILTER, matchesDateFilter, type DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { usePrintSareeTags, type SareeTagData } from "@/features/weavers";
import { rupees, formatMoney } from "@/lib/domain/money";
import { removeFromListWhere } from "../../../../lib/cacheUpdates";

/**
 * Returned sarees as their own stock, categorised by where they came back
 * from. This is deliberately separate from the dispatched-stock table above
 * it: a return is not sellable on arrival. It sits HELD until someone has
 * physically checked the piece and pressed "Send to inventory", which is the
 * only thing that puts it on the shelf and into the New Sale picker.
 *
 * Laid out as the same DataTable as the stock above it, so a return reads
 * like any other row — the condition photo is a column, not a card, and the
 * filters (search, who it came from, saree type, date) are the same controls.
 */

/** The bucket a return sits in. `retail`/`wholesale` say where it came FROM;
 *  `held`/`inventory` say what has been DONE with it since. */
type CategoryFilter = "all" | "retail" | "wholesale" | "held" | "inventory";

const fmtDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const typeLabel = (r: ReturnStockItem): string => {
  if (r.sareeTypeCode && r.sareeTypeLabel) return `${r.sareeTypeCode} · ${r.sareeTypeLabel}`;
  return r.sareeTypeCode ?? r.sareeTypeLabel ?? "No saree type";
};

/** Who sent it back — a counter customer, or a wholesale buyer. */
const sourceLabel = (r: ReturnStockItem): string => r.source ?? "—";

/** ReturnStockItem → the handful of fields a printed tag actually carries. */
function tagOf(r: ReturnStockItem): SareeTagData {
  return {
    sareeId: r.sareeId,
    batchId: null,
    designCode: r.designCode,
    sareeTypeCode: r.sareeTypeCode,
    sareeTypeName: r.sareeTypeLabel,
    color: r.color,
    retailPrice: r.retailPrice,
  };
}

function PhotoCell({ item, onZoom }: { item: ReturnStockItem; onZoom: (img: ZoomImage) => void }) {
  const photo = resolveAssetUrl(item.photoUrl);
  const retail = item.category === "retail";
  if (!photo) {
    return (
      <span
        aria-hidden
        title="No condition photo on file"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 38, height: 38, borderRadius: 8, flexShrink: 0,
          background: retail ? "rgba(171,56,50,0.07)" : "rgba(200,155,71,0.12)",
        }}
      >
        <Camera size={15} color={retail ? "#AB3832" : "#845E04"} />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onZoom({ url: photo, label: `Returned saree ${item.sareeId}` })}
      aria-label={`View photo of ${item.sareeId}`}
      style={{
        border: `1px solid ${C.bdr}`, padding: 0, borderRadius: 8, cursor: "zoom-in",
        width: 38, height: 38, flexShrink: 0,
        backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center",
      }}
    />
  );
}

export function ShopReturnsSection() {
  const printTags = usePrintSareeTags();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [zoom, setZoom] = useState<ZoomImage | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendError, setSendError] = useState<string | null>(null);
  const [dataView, setDataView] = useState<DataView>("table");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["return-stock"],
    queryFn: () => salesApi.listReturnStock(),
  });
  const returns = useMemo(() => data ?? [], [data]);

  const sendToInventory = useMutation({
    mutationFn: (returnRef: string) => salesApi.sendReturnToInventory(returnRef),
    onSuccess: (_result, returnRef) => {
      setSendError(null);
      // It has left the returns queue for sellable stock — drop it now so the
      // row can't be sent a second time while the refetch is still in flight.
      removeFromListWhere<ReturnStockItem>(queryClient, ["return-stock"], r => r.returnRef === returnRef);
      // Both lists move: the return is now sellable stock.
      void queryClient.invalidateQueries({ queryKey: ["return-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["shop-stock"] });
    },
    onError: (err: unknown) => {
      setSendError(
        err instanceof Error
          ? `Could not send it to inventory: ${err.message}`
          : "Could not send it to inventory.",
      );
    },
  });

  /** Sends every held return in `refs` one after another, so a partial failure
   *  still leaves the successful ones restocked and names the one that broke. */
  const sendMany = async (refs: string[]) => {
    setSendError(null);
    const done: string[] = [];
    for (const ref of refs) {
      try {
        await salesApi.sendReturnToInventory(ref);
        done.push(ref);
      } catch (err) {
        setSendError(
          `Sent ${done.length} of ${refs.length} to inventory. ${ref} failed: ` +
          (err instanceof Error ? err.message : "unknown error"),
        );
        break;
      }
    }
    setSelected(new Set());
    void queryClient.invalidateQueries({ queryKey: ["return-stock"] });
    void queryClient.invalidateQueries({ queryKey: ["shop-stock"] });
  };

  const retailCount = returns.filter(r => r.category === "retail").length;
  const wholesaleCount = returns.length - retailCount;
  const heldCount = returns.filter(r => !r.inInventory).length;
  const inInventoryCount = returns.length - heldCount;

  const sources = useMemo(
    () => [...new Set(returns.map(sourceLabel))].filter(s => s !== "—").sort((a, b) => a.localeCompare(b)),
    [returns],
  );
  const types = useMemo(
    () => [...new Set(returns.map(typeLabel))].sort((a, b) => a.localeCompare(b)),
    [returns],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return returns.filter(r => {
      const matchCategory =
        category === "all"
        || (category === "held" && !r.inInventory)
        || (category === "inventory" && r.inInventory)
        || r.category === category;
      const matchSearch = !q
        || r.sareeId.toLowerCase().includes(q)
        || r.returnRef.toLowerCase().includes(q)
        || sourceLabel(r).toLowerCase().includes(q)
        || typeLabel(r).toLowerCase().includes(q)
        || (r.reason ?? "").toLowerCase().includes(q)
        || (r.saleRef ?? "").toLowerCase().includes(q);
      const matchSource = sourceFilter.length === 0 || sourceFilter.includes(sourceLabel(r));
      const matchType = typeFilter.length === 0 || typeFilter.includes(typeLabel(r));
      const matchDate = matchesDateFilter(r.returnDate, dateFilter);
      return matchCategory && matchSearch && matchSource && matchType && matchDate;
    });
  }, [returns, category, search, sourceFilter, typeFilter, dateFilter]);

  const filtersActive =
    category !== "all" || search.trim() !== "" || sourceFilter.length > 0
    || typeFilter.length > 0 || dateFilter.mode !== "all";

  const clearFilters = () => {
    setCategory("all");
    setSearch("");
    setSourceFilter([]);
    setTypeFilter([]);
    setDateFilter(DEFAULT_DATE_FILTER);
  };

  const byRef = useMemo(() => new Map(returns.map(r => [r.returnRef, r])), [returns]);
  const selectedRows = useMemo(
    () => [...selected].map(ref => byRef.get(ref)).filter(Boolean) as ReturnStockItem[],
    [selected, byRef],
  );
  const selectedHeld = selectedRows.filter(r => !r.inInventory);

  const columns = useMemo<ColumnDef<ReturnStockItem>[]>(() => [
    {
      id: "photo", header: "Photo", accessor: r => r.photoUrl, priority: 3,
      cell: (_v, r) => <PhotoCell item={r} onZoom={setZoom} />,
    },
    {
      id: "sareeId", header: "Saree ID", type: "code", priority: 1, sortable: true,
      accessor: r => r.sareeId,
      cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{r.sareeId}</span>,
    },
    {
      id: "sareeType", header: "Saree Type", priority: 1, sortable: true,
      accessor: r => typeLabel(r),
      cell: (_v, r) => (
        <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
          {r.sareeTypeCode ? <span style={{ fontFamily: F.m, color: C.burg }}>{r.sareeTypeCode}</span> : null}
          {r.sareeTypeCode && r.sareeTypeLabel ? <span style={{ color: C.muted }}> · </span> : null}
          {r.sareeTypeLabel ?? (r.sareeTypeCode ? null : "—")}
          {r.color ? <span style={{ color: C.muted }}> · {r.color}</span> : null}
        </span>
      ),
    },
    {
      id: "from", header: "Came back from", priority: 1, sortable: true,
      accessor: r => sourceLabel(r),
      cell: (_v, r) => (
        <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>
          {sourceLabel(r)}
          <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 2 }}>
            {r.category === "retail" ? "Retail customer" : "Wholesale buyer"}
          </span>
        </span>
      ),
    },
    {
      id: "returnDate", header: "Returned", type: "date", priority: 2, sortable: true,
      accessor: r => r.returnDate,
      cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13 }}>{fmtDate(r.returnDate)}</span>,
    },
    {
      id: "reason", header: "Reason", priority: 2, sortable: true,
      accessor: r => r.reason ?? "—",
      cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.reason ?? "—"}</span>,
    },
    {
      id: "retailPrice", header: "Retail Price", type: "currency", priority: 2, sortable: true,
      accessor: r => r.retailPrice,
      cell: (_v, r) => r.retailPrice != null
        ? <span style={{ fontFamily: F.m, fontWeight: 700, color: C.gold, fontVariantNumeric: "tabular-nums" }}>{formatMoney(rupees(r.retailPrice))}</span>
        : <span style={{ color: C.muted }}>—</span>,
    },
    {
      id: "refund", header: "Refunded", type: "currency", priority: 3, sortable: true,
      accessor: r => r.refundAmount,
      cell: (_v, r) => r.refundAmount != null
        ? <span style={{ fontFamily: F.m, color: C.text, fontVariantNumeric: "tabular-nums" }}>{formatMoney(rupees(r.refundAmount))}</span>
        : <span style={{ color: C.muted }}>—</span>,
    },
    {
      id: "status", header: "Status", type: "status", priority: 1, sortable: true,
      accessor: r => (r.inInventory ? "In inventory" : "Held"),
      cell: (_v, r) => r.inInventory
        ? <Chip label="✓ In inventory" color={C.green} bg="rgba(30,102,64,0.10)" />
        : <Chip label="Held — not on sale" color={C.muted} bg="rgba(105,99,94,0.10)" />,
    },
    {
      id: "returnRef", header: "Return ref", type: "code", priority: 3, sortable: true,
      accessor: r => r.returnRef,
      cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 11.5, color: C.muted }}>{r.returnRef}</span>,
    },
    {
      id: "actions", header: "Actions", type: "actions", accessor: () => null,
      cell: (_v, r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IconButton
            icon={Printer}
            label={`Print tag for ${r.sareeId}`}
            variant="ghost"
            size="sm"
            onClick={() => printTags([tagOf(r)])}
          />
          {r.inInventory ? (
            <span title="Already sent to inventory" style={{ display: "inline-flex", alignItems: "center", color: C.green }}>
              <CheckCircle2 size={16} />
            </span>
          ) : (
            <Button
              variant="primary" size="sm" iconLeft={PackageCheck}
              onClick={() => sendToInventory.mutate(r.returnRef)}
              disabled={sendToInventory.isPending && sendToInventory.variables === r.returnRef}
              className="rounded-full whitespace-nowrap"
            >
              {sendToInventory.isPending && sendToInventory.variables === r.returnRef ? "Sending…" : "Send to inventory"}
            </Button>
          )}
        </span>
      ),
    },
  ], [printTags, sendToInventory]);

  const tabs: { key: CategoryFilter; label: string; count: number; Icon: typeof RotateCcw }[] = [
    { key: "all", label: "All returns", count: returns.length, Icon: RotateCcw },
    { key: "retail", label: "Retail returns", count: retailCount, Icon: ShoppingBag },
    { key: "wholesale", label: "Wholesale returns", count: wholesaleCount, Icon: Building2 },
    { key: "held", label: "Held", count: heldCount, Icon: Camera },
    { key: "inventory", label: "Sent to inventory", count: inInventoryCount, Icon: PackageCheck },
  ];

  return (
    <div style={{ margin: "0 20px 20px" }}>
      <ImageZoomModal image={zoom} onClose={() => setZoom(null)} />

      <SectionCard
        icon={RotateCcw}
        title="Returned Sarees"
        subtitle="Pieces that came back — from a customer at the counter, or from a wholesale buyer. A return is held and not on sale until you check the saree and press Send to inventory, which is what moves it into the stock table above and into the New Sale picker."
        actions={heldCount > 0 ? <Chip label={`${heldCount} awaiting a decision`} color={C.crim} bg="rgba(192,57,43,0.09)" /> : undefined}
      >
        <div style={{ marginBottom: 12 }}>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search returns by Saree ID, customer, vendor, saree type, reason or return ref"
              iconLeft={Search}
              size="lg"
              containerClassName="rounded-xl h-12"
            />
          </div>

          <div role="tablist" aria-label="Return category" style={{
            display: "inline-flex", gap: 4, padding: 4, borderRadius: 999, marginBottom: 12,
            background: "rgba(110,15,45,0.06)", border: `1px solid ${C.bdr}`, maxWidth: "100%", overflowX: "auto" as const,
          }}>
            {tabs.map(t => {
              const on = category === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setCategory(t.key)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" as const,
                    padding: "7px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                    background: on ? C.burg : "transparent",
                    color: on ? "#FFFDF9" : C.muted,
                    fontFamily: F.u, fontSize: 13, fontWeight: 700,
                  }}
                >
                  <t.Icon size={14} />
                  {t.label}
                  <span style={{
                    fontFamily: F.m, fontSize: 11.5, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                    background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.08)",
                    color: on ? "#FFFDF9" : C.burg,
                  }}>{t.count}</span>
                </button>
              );
            })}
          </div>

          {/* When it came back — the same date filter every other history table
              in the app uses, so "all time / a day / a range / a month / a
              year" behaves identically here. */}
          <div style={{ marginBottom: 12 }}>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginBottom: 12 }}>
            <MultiSelect
              options={sources.map(s => ({ value: s, label: s }))}
              value={sourceFilter}
              onValueChange={setSourceFilter}
              placeholder="Anyone who returned"
            />
            <MultiSelect
              options={types.map(t => ({ value: t, label: t }))}
              value={typeFilter}
              onValueChange={setTypeFilter}
              placeholder="All saree types"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const, marginBottom: 14 }}>
            <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>
              Showing {filtered.length} of {returns.length} returns · {filtered.filter(r => !r.inInventory).length} still held
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {filtered.length > 0 && (
                <Button
                  variant="secondary" size="sm" iconLeft={Printer}
                  onClick={() => printTags(filtered.map(tagOf))}
                  className="rounded-full"
                >
                  Print {filtered.length} tag{filtered.length === 1 ? "" : "s"}
                </Button>
              )}
              {filtersActive && (
                <Button variant="link" size="sm" onClick={clearFilters} className="p-0 text-xs underline text-[#69635E]">
                  Clear filters
                </Button>
              )}
              <ViewToggle value={dataView} onChange={setDataView} />
            </div>
          </div>

          {/* Bulk actions — checking five pieces in one go and shelving them
              together is the normal rhythm after a consignment arrives. */}
          {selected.size > 0 && (
            <div style={{
              marginBottom: 14, padding: "10px 14px", background: C.burg, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const,
            }}>
              <span style={{ fontFamily: F.u, fontSize: 13.5, fontWeight: 700, color: "#FFFDF9" }}>
                {selected.size} return{selected.size === 1 ? "" : "s"} selected
                {selectedHeld.length !== selected.size && (
                  <span style={{ fontWeight: 500, opacity: 0.8 }}> · {selectedHeld.length} still held</span>
                )}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button variant="secondary" size="sm" iconLeft={Printer} onClick={() => printTags(selectedRows.map(tagOf))} className="rounded-[14px]">
                  Print {selected.size} tag{selected.size === 1 ? "" : "s"}
                </Button>
                {selectedHeld.length > 0 && (
                  <Button
                    variant="secondary" size="sm" iconLeft={PackageCheck}
                    onClick={() => void sendMany(selectedHeld.map(r => r.returnRef))}
                    className="rounded-full"
                  >
                    Send {selectedHeld.length} to inventory
                  </Button>
                )}
                <Button variant="link" size="sm" iconLeft={X} onClick={() => setSelected(new Set())} className="p-0 text-xs text-[#FFFDF9] underline">
                  Clear
                </Button>
              </div>
            </div>
          )}

          {sendError && (
            <div role="alert" style={{ marginBottom: 14, fontFamily: F.u, fontSize: 13, color: "#C0392B", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "10px 14px" }}>
              {sendError}
            </div>
          )}

          {isLoading && <LoadingState variant="skeleton" rows={3} />}
          {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

          {!isLoading && !isError && returns.length === 0 && (
            <EmptyState
              icon="goodsReceipt"
              title="No returns yet"
              description="Returns processed from the Process Return screen appear here, categorised by where they came back from."
            />
          )}

          {!isLoading && !isError && returns.length > 0 && (
            <DataTable
              columns={columns}
              data={filtered}
              getRowId={r => r.returnRef}
              caption="Sarees returned to this shop"
              density="compact"
              view={dataView}
              pagination
              isFiltered={filtersActive}
              onClearFilters={clearFilters}
              emptyTitle="Nothing matches"
              emptyDescription="No returns match these filters. Clear them to see the rest."
              selectedIds={selected}
              onSelectionChange={setSelected}
            />
          )}
      </SectionCard>
    </div>
  );
}
