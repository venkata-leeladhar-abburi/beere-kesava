import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Truck, Package, ChevronDown, ChevronRight } from "lucide-react";

import { useCanSeePrices } from "./theme";
import { C, F, TEAL, Card, Chip } from "./theme";
import { inventoryApi, type ShopStockItem } from "../../../../shared/api/inventory";
import { Button, Input } from "../../../../shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState, FilteredEmptyState } from "../../../../shared/ui/state";
import { Money } from "@/shared/ui/domain/Money";
import { rupees } from "@/lib/domain/money";

/**
 * Shop stock — everything an admin actually dispatched to this shop, and
 * nothing else. Deliberately NOT the admin's Finished Goods table, which lists
 * the whole factory: a saree only belongs here once it has physically been sent
 * over, so this reads `GET /inventory/shop` (sarees on a SHOP dispatch, unsold)
 * rather than the factory stock list.
 *
 * Stock arrives by consignment, so that is the organising idea: sarees are
 * grouped under the dispatch that delivered them, and the dispatch itself is a
 * filter alongside weaver, loom and availability.
 */

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** How a consignment is labelled everywhere in this view. */
const dispatchLabel = (d: ShopStockItem["dispatch"]): string =>
  d.lrNumber ? `LR ${d.lrNumber}` : `Dispatch ${fmtDate(d.dispatchDate)}`;

type AvailabilityFilter = "All Sarees" | "Available" | "Sold";

/** Shop stock reads two ways: by the consignment that delivered it, and by what
 *  the saree actually is. Both are useful at the counter — "what came in on
 *  Tuesday's van" and "how many Bridal Specials do we have". */
type GroupMode = "dispatch" | "type";

function StatCard({ label, value, sub, tone }: {
  label: string;
  value: string;
  sub: string;
  tone: "dark" | "gold" | "teal";
}) {
  const skin = {
    dark: { bg: C.dark, label: "rgba(255,255,255,0.60)", value: "#FFF", sub: "rgba(255,255,255,0.55)", border: "none" },
    gold: { bg: C.gold, label: "rgba(26,10,15,0.65)", value: C.text, sub: "rgba(26,10,15,0.55)", border: "none" },
    teal: { bg: "rgba(15,118,110,0.10)", label: TEAL, value: TEAL, sub: TEAL, border: `1px solid rgba(15,118,110,0.30)` },
  }[tone];

  return (
    <div style={{ flex: "1 1 160px", background: skin.bg, border: skin.border, borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: skin.label, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: skin.value, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: F.u, fontSize: 12, color: skin.sub, opacity: 0.85, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function FilterPills({ label, options, isSelected, onToggle }: {
  label?: string;
  options: { key: string; label: string }[];
  isSelected: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" as const }}>
          {label}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4 }}>
        {options.map(o => (
          <Button
            key={o.key}
            onClick={() => onToggle(o.key)}
            size="sm"
            className={
              "shrink-0 rounded-full px-4 py-2 h-auto whitespace-nowrap border " +
              (isSelected(o.key)
                ? "border-[#6E0F2D] bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-semibold"
                : "border-[rgba(110,15,45,0.12)] bg-transparent hover:bg-[#6E0F2D]/10 text-[#69635E] hover:text-[#6E0F2D] font-semibold")
            }
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SareeCard({ s, canSeePrices }: { s: ShopStockItem; canSeePrices: boolean }) {
  const sold = s.status === "sold";
  return (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.bdr}`, padding: 16, display: "flex", gap: 12 }}>
      <div style={{ width: 5, borderRadius: 3, background: sold ? C.muted : C.burg, flexShrink: 0, alignSelf: "stretch" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" as const }}>
          <span style={{ fontFamily: F.m, fontSize: 14, color: C.burg, fontWeight: 600 }}>{s.sareeId}</span>
          {s.source === "factory"
            ? <Chip label="🏭 Factory" color={C.green} bg="rgba(30,102,64,0.10)" />
            : <Chip label="🧵 Outsourced" color={C.gold} bg="rgba(200,155,71,0.12)" />}
        </div>

        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 3 }}>
          {s.sareeTypeLabel ?? s.sareeTypeCode ?? "Saree"}
        </div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}>
          {s.designCode ?? "—"}{s.sareeTypeCode ? ` · ${s.sareeTypeCode}` : ""}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
          {s.weaverName && <Chip label={`🧵 ${s.weaverName}`} color={C.burg} bg="rgba(110,15,45,0.08)" />}
          {s.loomNumber && <Chip label={`Loom ${s.loomNumber}`} color={TEAL} bg="rgba(15,118,110,0.10)" />}
        </div>

        {canSeePrices && s.retailPrice != null && (
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 19, color: C.gold, marginBottom: 6 }}>
            Retail: <Money value={rupees(s.retailPrice)} />
          </div>
        )}

        <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>
          QC passed {fmtDate(s.qcDate)} · Received {fmtDate(s.dispatch.dispatchDate)}
          {s.dispatch.transportCompany ? ` via ${s.dispatch.transportCompany}` : ""}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const }}>
          <Chip
            label={sold ? `Sold${s.customer ? ` · ${s.customer}` : ""}` : "✓ Available"}
            color={sold ? C.muted : C.green}
            bg={sold ? "rgba(105,99,94,0.10)" : "rgba(30,102,64,0.10)"}
          />
        </div>
      </div>
    </div>
  );
}

function ShopInventory() {
  const canSeePrices = useCanSeePrices();
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("All Sarees");
  const [dispatchFilter, setDispatchFilter] = useState<string[]>([]);
  const [loomFilter, setLoomFilter] = useState<string[]>([]);
  const [weaverFilter, setWeaverFilter] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState<GroupMode>("dispatch");

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
  // Consignments, newest first — the dispatch filter and the grouping below
  // both read this, so they stay in the same order.
  const dispatches = useMemo(() => {
    const byId = new Map<string, ShopStockItem["dispatch"]>();
    stock.forEach(s => { if (!byId.has(s.dispatch.dispatchId)) byId.set(s.dispatch.dispatchId, s.dispatch); });
    return [...byId.values()].sort(
      (a, b) => new Date(b.dispatchDate).getTime() - new Date(a.dispatchDate).getTime(),
    );
  }, [stock]);

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) =>
    setter(prev => (key === "__all"
      ? []
      : prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stock.filter(s => {
      const matchSearch = !q
        || s.sareeId.toLowerCase().includes(q)
        || (s.designCode ?? "").toLowerCase().includes(q)
        || (s.sareeTypeLabel ?? "").toLowerCase().includes(q)
        || (s.weaverName ?? "").toLowerCase().includes(q)
        || (s.loomNumber ?? "").toLowerCase().includes(q)
        || (s.dispatch.lrNumber ?? "").toLowerCase().includes(q);
      const matchAvailability =
        availability === "All Sarees"
        || (availability === "Available" && s.status !== "sold")
        || (availability === "Sold" && s.status === "sold");
      const matchDispatch = dispatchFilter.length === 0 || dispatchFilter.includes(s.dispatch.dispatchId);
      const matchLoom = loomFilter.length === 0 || (!!s.loomNumber && loomFilter.includes(s.loomNumber));
      const matchWeaver = weaverFilter.length === 0 || (!!s.weaverName && weaverFilter.includes(s.weaverName));
      return matchSearch && matchAvailability && matchDispatch && matchLoom && matchWeaver;
    });
  }, [stock, search, availability, dispatchFilter, loomFilter, weaverFilter]);

  // Stock arrives by consignment and is counted by consignment, so that is how
  // it is listed — one section per dispatch, newest delivery first.
  const groups = useMemo<{ key: string; title: string; subtitle: string; badge?: string; sarees: ShopStockItem[] }[]>(() => {
    if (groupMode === "type") {
      const byType = new Map<string, ShopStockItem[]>();
      filtered.forEach(s => {
        const key = s.sareeTypeLabel ?? s.sareeTypeCode ?? "Uncategorised";
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
  }, [filtered, dispatches, groupMode]);

  const availableCount = stock.filter(s => s.status !== "sold").length;
  const soldCount = stock.length - availableCount;
  const filtersActive =
    search.trim() !== "" || availability !== "All Sarees"
    || dispatchFilter.length > 0 || loomFilter.length > 0 || weaverFilter.length > 0;

  const clearFilters = () => {
    setSearch("");
    setAvailability("All Sarees");
    setDispatchFilter([]);
    setLoomFilter([]);
    setWeaverFilter([]);
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>
          SINCE 1999 · SHOP INVENTORY
        </div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Shop Inventory</div>
        <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold }}>
          Sarees dispatched to this shop
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, padding: "16px 20px 4px" }}>
        <StatCard tone="dark" label="Total Received" value={`${stock.length}`} sub={`Across ${dispatches.length} dispatch${dispatches.length === 1 ? "" : "es"}`} />
        <StatCard tone="gold" label="Available for Sale" value={`${availableCount}`} sub="Ready for customers" />
        <StatCard tone="teal" label="Sold" value={`${soldCount}`} sub="Already billed" />
      </div>

      {/* Search + filters */}
      <Card style={{ margin: "16px 20px", padding: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Saree ID, design, weaver, loom or LR number"
            iconLeft={Search}
            size="lg"
            containerClassName="rounded-xl h-12"
          />
        </div>

        <FilterPills
          options={(["All Sarees", "Available", "Sold"] as AvailabilityFilter[]).map(f => ({ key: f, label: f }))}
          isSelected={k => availability === k}
          onToggle={k => setAvailability(k as AvailabilityFilter)}
        />

        <FilterPills
          label="Group by"
          options={[
            { key: "dispatch", label: "Dispatch" },
            { key: "type", label: "Saree type" },
          ]}
          isSelected={k => groupMode === k}
          onToggle={k => setGroupMode(k as GroupMode)}
        />

        <FilterPills
          label="Dispatch"
          options={[
            { key: "__all", label: "All Dispatches" },
            ...dispatches.map(d => ({
              key: d.dispatchId,
              label: `${dispatchLabel(d)} · ${fmtDate(d.dispatchDate)}`,
            })),
          ]}
          isSelected={k => (k === "__all" ? dispatchFilter.length === 0 : dispatchFilter.includes(k))}
          onToggle={toggleIn(setDispatchFilter)}
        />

        <FilterPills
          label="Loom"
          options={looms.length ? [{ key: "__all", label: "All Looms" }, ...looms.map(l => ({ key: l, label: `Loom ${l}` }))] : []}
          isSelected={k => (k === "__all" ? loomFilter.length === 0 : loomFilter.includes(k))}
          onToggle={toggleIn(setLoomFilter)}
        />

        <FilterPills
          label="Weaver"
          options={weavers.length ? [{ key: "__all", label: "All Weavers" }, ...weavers.map(w => ({ key: w, label: w }))] : []}
          isSelected={k => (k === "__all" ? weaverFilter.length === 0 : weaverFilter.includes(k))}
          onToggle={toggleIn(setWeaverFilter)}
        />

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
      </Card>

      {/* Stock, grouped by the dispatch that delivered it */}
      {isLoading && (
        <div style={{ margin: "0 20px 12px" }}>
          <LoadingState variant="skeleton" rows={4} />
        </div>
      )}

      {isError && (
        <div style={{ margin: "0 20px 12px" }}>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </div>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <div style={{ margin: "0 20px 12px" }}>
          {filtersActive ? (
            <FilteredEmptyState onClearFilters={clearFilters} />
          ) : (
            <EmptyState
              icon="goodsReceipt"
              title="Nothing dispatched to the shop yet"
              description="Sarees appear here once an admin dispatches them to this shop from Finished Goods & Dispatch."
            />
          )}
        </div>
      )}

      {!isLoading && !isError && groups.map(group => {
        const isCollapsed = collapsed.has(group.key);
        return (
          <div key={group.key} style={{ margin: "0 20px 14px" }}>
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
                borderRadius: 14, padding: "12px 14px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              {isCollapsed ? <ChevronRight size={16} color={C.burg} /> : <ChevronDown size={16} color={C.burg} />}
              {groupMode === "dispatch"
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
              {group.badge && <Chip label={group.badge} color={C.gold} bg="rgba(200,155,71,0.14)" />}
            </button>

            {!isCollapsed && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {group.sarees.map(s => <SareeCard key={s.sareeId} s={s} canSeePrices={canSeePrices} />)}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
}

export { ShopInventory };
