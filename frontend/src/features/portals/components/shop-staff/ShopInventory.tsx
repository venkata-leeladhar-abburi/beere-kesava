import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Truck, Package, ChevronDown, ChevronRight, Printer, X, CheckCircle } from "lucide-react";

import { C, F, TEAL, Chip, PortalStatsStrip, PageHero, SectionCard } from "./theme";
import { sareeTypeName, sareeTypeText } from "./stock-format";
import { inventoryApi, type ShopStockItem } from "../../../../shared/api/inventory";
import { Button, Input, IconButton, MultiSelect } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { DateFilterBar, DEFAULT_DATE_FILTER, matchesDateFilter, type DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { LoadingState, ErrorState, EmptyState } from "../../../../shared/ui/state";
import { usePrintSareeTags } from "@/features/weavers";
import { ShopReturnsSection } from "./ShopReturnsSection";
import { IncomingDispatchSection } from "./IncomingDispatchSection";
import { ReceivedHistorySection } from "./ReceivedHistorySection";
import { rupees, formatMoney } from "@/lib/domain/money";

/**
 * Shop stock — everything an admin actually dispatched to this shop, and
 * nothing else. Deliberately NOT the admin's Finished Goods table, which lists
 * the whole factory: a saree only belongs here once it has physically been sent
 * over, so this reads `GET /inventory/shop` (sarees on a SHOP dispatch) rather
 * than the factory stock list.
 *
 * Presented the same way the admin and super-admin portals present inventory:
 * a real table (`DataTable`), not a card wall — the counter needs to scan a
 * column, not read paragraphs. Three views over the same rows:
 *
 *   All sarees    one flat table, the default
 *   By dispatch   a collapsible table per consignment ("what came in Tuesday")
 *   By saree type one per type ("how many Bridal Specials do we have")
 *
 * Rows are tickable in every view and the selection is shared across them, so
 * staff can select across dispatches and print one sheet of barcode tags.
 */

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** How a consignment is labelled everywhere in this view. */
const dispatchLabel = (d: ShopStockItem["dispatch"]): string => {
  // Returned pieces never travelled on a lorry — they share one stand-in
  // consignment, and calling it "Dispatch 12 Aug" would be a lie.
  if (d.dispatchId === "RETURNED-STOCK") return "Returned stock";
  return d.lrNumber ? `LR ${d.lrNumber}` : `Dispatch ${fmtDate(d.dispatchDate)}`;
};

/** Saree type is one column, not two: the code and the name of the type the
 *  admin created. There is no design column here — the shop sells types. */
const typeLabel = (s: ShopStockItem): string => sareeTypeText(s);

/** The counter's own selling price. Deliberately NOT behind `useCanSeePrices`
 *  (which gates cost, margin and payroll): shop staff cannot serve a customer
 *  without knowing what the saree sells for, and this is the same figure the
 *  admin typed as Retail Price on the saree type. */
const fmtRetail = (retailRupees: number | null): string | null =>
  retailRupees == null ? null : formatMoney(rupees(retailRupees));

type AvailabilityFilter = "all" | "available" | "sold";
type OriginFilter = "all" | "dispatch" | "return";
type ViewMode = "all" | "dispatch" | "type" | "origin";

/**
 * One segmented control, not a scrolling row of look-alike pills. A single
 * choice out of two or three reads as a switch, so it is drawn as one — the
 * selected segment is filled, and each segment carries its own count so staff
 * can see how much stock sits behind a tab before pressing it.
 */
function Segmented<K extends string>({ label, value, options, onChange }: {
  label?: string;
  value: K;
  options: { key: K; label: string; count?: number }[];
  onChange: (key: K) => void;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      {label && (
        <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" as const }}>
          {label}
        </div>
      )}
      <div
        role="tablist"
        aria-label={label}
        style={{
          display: "inline-flex", gap: 4, padding: 4, borderRadius: 999,
          background: "rgba(110,15,45,0.06)", border: `1px solid ${C.bdr}`, maxWidth: "100%", overflowX: "auto" as const,
        }}
      >
        {options.map(o => {
          const on = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(o.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" as const,
                padding: "7px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                background: on ? C.burg : "transparent",
                color: on ? "#FFFDF9" : C.muted,
                fontFamily: F.u, fontSize: 13, fontWeight: 700,
              }}
            >
              {o.label}
              {o.count != null && (
                <span style={{
                  fontFamily: F.m, fontSize: 11.5, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                  background: on ? "rgba(255,255,255,0.22)" : "rgba(110,15,45,0.08)",
                  color: on ? "#FFFDF9" : C.burg,
                }}>{o.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** How a saree got here, when that is not the usual "a lorry brought it". */
const ORIGIN_LABEL: Record<ShopStockItem["stockOrigin"], string> = {
  dispatch: "Dispatched",
  "retail-return": "Retail return",
  "wholesale-return": "Wholesale return",
};

function StatusChip({ s }: { s: ShopStockItem }) {
  const sold = s.status === "sold";
  return (
    <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" as const }}>
      <Chip
        label={sold ? `Sold${s.customer ? ` · ${s.customer}` : ""}` : "✓ Available"}
        color={sold ? C.muted : C.green}
        bg={sold ? "rgba(105,99,94,0.10)" : "rgba(30,102,64,0.10)"}
      />
      {s.stockOrigin !== "dispatch" && (
        <Chip
          label={ORIGIN_LABEL[s.stockOrigin]}
          color={s.stockOrigin === "retail-return" ? "#AB3832" : "#845E04"}
          bg={s.stockOrigin === "retail-return" ? "rgba(171,56,50,0.09)" : "rgba(200,155,71,0.14)"}
        />
      )}
    </div>
  );
}

function ShopInventory() {
  const printTags = usePrintSareeTags();
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [origin, setOrigin] = useState<OriginFilter>("all");
  const [dispatchFilter, setDispatchFilter] = useState<string[]>([]);
  const [loomFilter, setLoomFilter] = useState<string[]>([]);
  const [weaverFilter, setWeaverFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  // When the stock arrived — the same "all time / a day / a range / a month /
  // a year" control every other history table in the app uses.
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["shop-stock"],
    queryFn: () => inventoryApi.shopStock(),
  });

  const stock = useMemo(() => data ?? [], [data]);

  const looms = useMemo(
    () => [...new Set(stock.map(s => s.loomNumber).filter(Boolean))] as string[],
    [stock],
  );
  const weavers = useMemo(
    () => [...new Set(stock.map(s => s.weaverName).filter(Boolean))] as string[],
    [stock],
  );
  const types = useMemo(
    () => [...new Set(stock.map(typeLabel))].sort((a, b) => a.localeCompare(b)),
    [stock],
  );
  // Consignments, newest first — the dispatch filter and the grouping below
  // both read this, so they stay in the same order.
  const dispatches = useMemo(() => {
    const byId = new Map<string, ShopStockItem["dispatch"]>();
    stock.forEach(s => { if (!byId.has(s.dispatch.dispatchId)) byId.set(s.dispatch.dispatchId, s.dispatch); });
    return [...byId.values()].sort(
      (a, b) => new Date(b.dispatchDate).getTime() - new Date(a.dispatchDate).getTime(),
    );
  }, [stock]);

  const anySold = useMemo(() => stock.some(s => s.soldPrice != null), [stock]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stock.filter(s => {
      const matchSearch = !q
        || s.sareeId.toLowerCase().includes(q)
        || typeLabel(s).toLowerCase().includes(q)
        || (s.weaverName ?? "").toLowerCase().includes(q)
        || (s.loomNumber ?? "").toLowerCase().includes(q)
        || (s.dispatch.lrNumber ?? "").toLowerCase().includes(q)
        || (s.returnedFrom ?? "").toLowerCase().includes(q)
        || (s.returnRef ?? "").toLowerCase().includes(q);
      const matchAvailability =
        availability === "all"
        || (availability === "available" && s.status !== "sold")
        || (availability === "sold" && s.status === "sold");
      const matchOrigin =
        origin === "all"
        || (origin === "dispatch" && s.stockOrigin === "dispatch")
        || (origin === "return" && s.stockOrigin !== "dispatch");
      const matchDispatch = dispatchFilter.length === 0 || dispatchFilter.includes(s.dispatch.dispatchId);
      const matchLoom = loomFilter.length === 0 || (!!s.loomNumber && loomFilter.includes(s.loomNumber));
      const matchWeaver = weaverFilter.length === 0 || (!!s.weaverName && weaverFilter.includes(s.weaverName));
      const matchType = typeFilter.length === 0 || typeFilter.includes(typeLabel(s));
      // A sold saree is filtered on the day it sold, everything else on the day
      // it arrived — "show me last month" should mean last month's sales when
      // looking at Sold, and last month's deliveries otherwise.
      const timelineDate = availability === "sold" && s.soldDate ? s.soldDate : s.dispatch.dispatchDate;
      const matchDate = matchesDateFilter(timelineDate, dateFilter);
      return matchSearch && matchAvailability && matchOrigin && matchDispatch
        && matchLoom && matchWeaver && matchType && matchDate;
    });
  }, [stock, search, availability, origin, dispatchFilter, loomFilter, weaverFilter, typeFilter, dateFilter]);

  // ── Table shape ─────────────────────────────────────────────────────────
  // One column set, reused by the flat table and by every grouped table, so
  // the three views stay literally the same table.
  const columns = useMemo<ColumnDef<ShopStockItem>[]>(() => [
    {
      id: "sareeId", header: "Saree ID", type: "code", priority: 1, sortable: true,
      accessor: r => r.sareeId,
      cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{r.sareeId}</span>,
    },
    {
      id: "sareeType", header: "Saree Type", priority: 1, sortable: true,
      accessor: r => typeLabel(r),
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
      cell: (_v, r) => {
        const price = fmtRetail(r.retailPrice);
        return price
          ? <span style={{ fontFamily: F.m, fontWeight: 700, color: C.gold, fontVariantNumeric: "tabular-nums" }}>{price}</span>
          : <span style={{ color: C.muted }} title="No retail price set on this saree type yet">—</span>;
      },
    },
    // Only worth a column once something has actually been sold — on a shop
    // with nothing sold yet it would be a column of dashes.
    ...(anySold ? [{
      id: "soldPrice", header: "Sold For", type: "currency" as const, priority: 1, sortable: true,
      accessor: (r: ShopStockItem) => r.soldPrice,
      cell: (_v: unknown, r: ShopStockItem) => {
        if (r.soldPrice == null) return <span style={{ color: C.muted }}>—</span>;
        const diff = r.retailPrice != null ? r.soldPrice - r.retailPrice : 0;
        return (
          <span style={{ display: "inline-block", textAlign: "right" as const }}>
            <span style={{ fontFamily: F.m, fontWeight: 700, color: C.green, fontVariantNumeric: "tabular-nums" }}>
              {formatMoney(rupees(r.soldPrice))}
            </span>
            {diff !== 0 && (
              <span style={{ display: "block", fontFamily: F.u, fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                {diff < 0 ? "−" : "+"}{formatMoney(rupees(Math.abs(diff)))} vs retail
              </span>
            )}
          </span>
        );
      },
    } as ColumnDef<ShopStockItem>] : []),
    ...(anySold ? [{
      id: "soldDate", header: "Sold On", type: "date" as const, priority: 3, sortable: true,
      accessor: (r: ShopStockItem) => r.soldDate,
      cell: (_v: unknown, r: ShopStockItem) => <span style={{ fontFamily: F.u, fontSize: 13 }}>{fmtDate(r.soldDate)}</span>,
    } as ColumnDef<ShopStockItem>] : []),
    {
      id: "dispatch", header: "Dispatch", priority: 3, sortable: true,
      accessor: r => dispatchLabel(r.dispatch),
      cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{dispatchLabel(r.dispatch)}</span>,
    },
    {
      id: "received", header: "Received", type: "date", priority: 2, sortable: true,
      accessor: r => r.dispatch.dispatchDate,
      cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13 }}>{fmtDate(r.dispatch.dispatchDate)}</span>,
    },
    {
      id: "status", header: "Status", type: "status", priority: 1, sortable: true,
      accessor: r => (r.status === "sold" ? "Sold" : "Available"),
      cell: (_v, r) => <StatusChip s={r} />,
    },
    {
      id: "tag", header: "Label", type: "actions", accessor: () => null,
      cell: (_v, r) => (
        <IconButton
          icon={Printer}
          label={`Print label for ${r.sareeId}`}
          variant="ghost"
          size="sm"
          onClick={() => printTags([tagOf(r)])}
        />
      ),
    },
  ], [printTags, anySold]);

  // ── Grouping ────────────────────────────────────────────────────────────
  const groups = useMemo<{ key: string; title: string; subtitle: string; badge?: string; sarees: ShopStockItem[] }[]>(() => {
    if (view === "all") return [];

    if (view === "type") {
      const byType = new Map<string, ShopStockItem[]>();
      filtered.forEach(s => {
        const key = typeLabel(s);
        const list = byType.get(key);
        if (list) list.push(s);
        else byType.set(key, [s]);
      });
      return [...byType.entries()]
        .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
        .map(([key, sarees]) => ({
          key,
          title: key,
          subtitle: `${sarees.filter(s => s.status !== "sold").length} available of ${sarees.length}`,
          sarees,
        }));
    }

    if (view === "origin") {
      const byOrigin = new Map<ShopStockItem["stockOrigin"], ShopStockItem[]>();
      filtered.forEach(s => {
        const list = byOrigin.get(s.stockOrigin);
        if (list) list.push(s);
        else byOrigin.set(s.stockOrigin, [s]);
      });
      const order: ShopStockItem["stockOrigin"][] = ["dispatch", "retail-return", "wholesale-return"];
      return order
        .filter(k => byOrigin.has(k))
        .map(k => {
          const sarees = byOrigin.get(k)!;
          return {
            key: k,
            title: ORIGIN_LABEL[k],
            subtitle: k === "dispatch"
              ? "Sent over from the factory"
              : k === "retail-return"
                ? "Taken back at the counter and sent to inventory"
                : "Sent back by a wholesale buyer and sent to inventory",
            sarees,
          };
        });
    }

    const byDispatch = new Map<string, ShopStockItem[]>();
    filtered.forEach(s => {
      const list = byDispatch.get(s.dispatch.dispatchId);
      if (list) list.push(s);
      else byDispatch.set(s.dispatch.dispatchId, [s]);
    });
    return dispatches
      .filter(d => byDispatch.has(d.dispatchId))
      .map(d => ({
        key: d.dispatchId,
        title: dispatchLabel(d),
        subtitle: `Dispatched ${fmtDate(d.dispatchDate)}`
          + (d.transportCompany ? ` · ${d.transportCompany}` : "")
          + (d.vehicleNumber ? ` · ${d.vehicleNumber}` : ""),
        badge: d.pendingTransport ? "Transport pending" : undefined,
        sarees: byDispatch.get(d.dispatchId)!,
      }));
  }, [filtered, dispatches, view]);

  const availableCount = stock.filter(s => s.status !== "sold").length;
  const dispatchedCount = stock.filter(s => s.stockOrigin === "dispatch").length;
  const soldCount = stock.length - availableCount;
  const filtersActive =
    search.trim() !== "" || availability !== "all" || origin !== "all"
    || dispatchFilter.length > 0 || loomFilter.length > 0 || weaverFilter.length > 0
    || typeFilter.length > 0 || dateFilter.mode !== "all";

  const clearFilters = () => {
    setSearch("");
    setAvailability("all");
    setOrigin("all");
    setDispatchFilter([]);
    setLoomFilter([]);
    setWeaverFilter([]);
    setTypeFilter([]);
    setDateFilter(DEFAULT_DATE_FILTER);
  };

  // Selection is held here rather than inside each table so it survives
  // switching view and collapsing a group — tick five sarees across three
  // dispatches, then print all five tags on one sheet.
  const byId = useMemo(() => new Map(stock.map(s => [s.sareeId, s])), [stock]);
  const selectedRows = useMemo(
    () => [...selected].map(id => byId.get(id)).filter(Boolean) as ShopStockItem[],
    [selected, byId],
  );
  const printSelected = () => printTags(selectedRows.map(tagOf));

  /** Replaces the selection for one group's rows, leaving other groups' ticks
   *  alone — DataTable reports the selection of the rows it was given. */
  const selectionFor = (rows: ShopStockItem[]) => ({
    selectedIds: new Set([...selected].filter(id => rows.some(r => r.sareeId === id))),
    onSelectionChange: (ids: Set<string>) => setSelected(prev => {
      const next = new Set(prev);
      rows.forEach(r => next.delete(r.sareeId));
      ids.forEach(id => next.add(id));
      return next;
    }),
  });

  const table = (rows: ShopStockItem[], caption: string) => (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={r => r.sareeId}
      caption={caption}
      density="compact"
      responsive
      pagination
      loading={isLoading}
      error={isError}
      onRetry={() => void refetch()}
      isFiltered={filtersActive}
      onClearFilters={clearFilters}
      emptyTitle="No sarees match"
      emptyDescription="Nothing in shop stock matches these filters."
      {...selectionFor(rows)}
    />
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <PageHero
        eyebrow="SINCE 1999 · SHOP INVENTORY"
        title="Shop Inventory"
        titleAccent="Sarees dispatched to this shop"
      />

      {/* Stats */}
      <PortalStatsStrip 
        overlap={true}
        stats={[
          { label: "Total Received", value: stock.length, sub: `Across ${dispatches.length} dispatch${dispatches.length === 1 ? "" : "es"}`, icon: Truck },
          { label: "Available for Sale", value: availableCount, sub: "Ready for customers", icon: Package, highlight: true },
          { label: "Sold", value: soldCount, sub: "Already billed", icon: CheckCircle }
        ]} 
      />

      {/* Incoming first: a consignment sitting unreceived is the one thing on
          this page that needs doing, and nothing below it is stock until it
          has been. Its receipt history follows, then returns. */}
      <div style={{ marginTop: 32 }}>
        <IncomingDispatchSection />
      </div>

      <div style={{ marginTop: 32 }}>
        <ReceivedHistorySection />
      </div>

      {/* Returns — their own stock, and the gate that lets them be sold. */}
      <div style={{ marginTop: 32 }}>
        <ShopReturnsSection />
      </div>

      {/* Search + filters — one row of controls, in the order they get used:
          find it, narrow it, then choose how to read it. */}
      <div style={{ margin: "0 20px" }}>
        <SectionCard
          icon={Package}
          title="All Sarees Inventory"
          subtitle="Track every saree end to end, across all weavers and in-house looms combined"
          bodyPadding="20px"
        >
          <div style={{ marginBottom: 16 }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Saree ID, saree type, weaver, loom or LR number"
            iconLeft={Search}
            size="lg"
            containerClassName="rounded-xl h-12"
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, alignItems: "flex-end", marginBottom: 14 }}>
          <Segmented<AvailabilityFilter>
            label="Show"
            value={availability}
            onChange={setAvailability}
            options={[
              { key: "all", label: "All sarees", count: stock.length },
              { key: "available", label: "Available", count: availableCount },
              { key: "sold", label: "Sold", count: soldCount },
            ]}
          />
          <Segmented<OriginFilter>
            label="Came from"
            value={origin}
            onChange={setOrigin}
            options={[
              { key: "all", label: "Everything", count: stock.length },
              { key: "dispatch", label: "Dispatched", count: dispatchedCount },
              { key: "return", label: "Returns", count: stock.length - dispatchedCount },
            ]}
          />
          <Segmented<ViewMode>
            label="View as"
            value={view}
            onChange={setView}
            options={[
              { key: "all", label: "One list" },
              { key: "dispatch", label: "By dispatch" },
              { key: "type", label: "By saree type" },
              { key: "origin", label: "By source" },
            ]}
          />
        </div>

        {/* When — filters the delivery date, or the sale date while the Sold
            tab is showing, so one control answers both questions. */}
        <div style={{ marginBottom: 12 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginBottom: 12 }}>
          <MultiSelect
            options={dispatches.map(d => ({ value: d.dispatchId, label: `${dispatchLabel(d)} · ${fmtDate(d.dispatchDate)}` }))}
            value={dispatchFilter}
            onValueChange={setDispatchFilter}
            placeholder="All dispatches"
          />
          <MultiSelect
            options={types.map(t => ({ value: t, label: t }))}
            value={typeFilter}
            onValueChange={setTypeFilter}
            placeholder="All saree types"
          />
          <MultiSelect
            options={weavers.map(w => ({ value: w, label: w }))}
            value={weaverFilter}
            onValueChange={setWeaverFilter}
            placeholder="All weavers"
          />
          <MultiSelect
            options={looms.map(l => ({ value: l, label: `Loom ${l}` }))}
            value={loomFilter}
            onValueChange={setLoomFilter}
            placeholder="All looms"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const }}>
          <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            Showing {filtered.length} of {stock.length} sarees · {filtered.filter(s => s.status !== "sold").length} available
          </div>
          {filtersActive && (
            <Button variant="link" size="sm" onClick={clearFilters} className="p-0 text-xs underline text-[#69635E]">
              Clear filters
            </Button>
          )}
        </div>

      {/* Selection bar — the one thing you can do to a set of sarees from here
          is print their tags, so it is the only action offered. */}
      {selected.size > 0 && (
        <div style={{
          position: "sticky", top: 0, zIndex: 5, margin: "0 0 16px", padding: "10px 14px",
          background: C.burg, borderRadius: 12, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const,
        }}>
          <span style={{ fontFamily: F.u, fontSize: 13.5, fontWeight: 700, color: "#FFFDF9" }}>
            {selected.size} saree{selected.size === 1 ? "" : "s"} selected
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button variant="secondary" size="sm" iconLeft={Printer} onClick={printSelected} className="rounded-[14px]">
              Print {selected.size} label{selected.size === 1 ? "" : "s"}
            </Button>
            <Button variant="link" size="sm" iconLeft={X} onClick={() => setSelected(new Set())} className="p-0 text-xs text-[#FFFDF9] underline">
              Clear
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ margin: "0 0 12px" }}>
          <LoadingState variant="skeleton" rows={4} />
        </div>
      )}

      {isError && (
        <div style={{ margin: "0 0 12px" }}>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </div>
      )}

      {!isLoading && !isError && stock.length === 0 && (
        <div style={{ margin: "0 0 12px" }}>
          <EmptyState
            icon="goodsReceipt"
            title="Nothing dispatched to the shop yet"
            description="Sarees appear here once an admin dispatches them to this shop from Finished Goods & Dispatch."
          />
        </div>
      )}

      {/* ── One list ─────────────────────────────────────────────────────── */}
      {!isLoading && !isError && stock.length > 0 && view === "all" && (
        <div style={{ margin: "0 0 14px", padding: 0 }}>
          {table(filtered, "Sarees in shop stock")}
        </div>
      )}

      {/* ── Grouped: a collapsible table per dispatch / per saree type ────── */}
      {!isLoading && !isError && stock.length > 0 && view !== "all" && groups.map(group => {
        const isCollapsed = collapsed.has(group.key);
        const groupAvailable = group.sarees.filter(s => s.status !== "sold").length;
        return (
          <div key={group.key} style={{ margin: "0 0 14px" }}>
            <button
              type="button"
              onClick={() => setCollapsed(prev => {
                const next = new Set(prev);
                if (next.has(group.key)) next.delete(group.key);
                else next.add(group.key);
                return next;
              })}
              aria-expanded={!isCollapsed}
              style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                background: "rgba(110,15,45,0.05)", border: `1px solid ${C.bdr}`,
                borderRadius: isCollapsed ? 14 : "14px 14px 0 0", padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              {isCollapsed ? <ChevronRight size={16} color={C.burg} /> : <ChevronDown size={16} color={C.burg} />}
              {view === "dispatch"
                ? <Truck size={16} color={C.burg} style={{ flexShrink: 0 }} />
                : <Package size={16} color={C.burg} style={{ flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>
                  {group.title}
                  <span style={{ fontWeight: 500, color: C.muted }}> · {group.sarees.length} saree{group.sarees.length === 1 ? "" : "s"}</span>
                </div>
                <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginTop: 2 }}>
                  {group.subtitle}
                </div>
              </div>
              <Chip label={`${groupAvailable} available`} color={C.green} bg="rgba(30,102,64,0.10)" />
              {group.badge && <Chip label={group.badge} color={C.gold} bg="rgba(200,155,71,0.14)" />}
            </button>

            {!isCollapsed && (
              <div style={{ border: `1px solid ${C.bdr}`, borderTop: "none", borderRadius: "0 0 14px 14px", background: C.white, padding: 8 }}>
                {table(group.sarees, `${group.title} — sarees`)}
              </div>
            )}
          </div>
        );
      })}
        </SectionCard>
      </div>
    </div>
  );
}

/** ShopStockItem → the handful of fields a printed tag actually carries. */
function tagOf(s: ShopStockItem) {
  return {
    sareeId: s.sareeId,
    batchId: null,
    designCode: null,
    sareeTypeCode: s.sareeTypeCode,
    sareeTypeName: sareeTypeName(s),
    color: null,
    retailPrice: s.retailPrice,
  };
}

export { ShopInventory };
