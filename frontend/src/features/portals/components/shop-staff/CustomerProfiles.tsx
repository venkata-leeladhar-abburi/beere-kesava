import { useMemo, useState } from 'react';
import { Search, UserRound, Phone, ArrowRight, ShoppingBag, Star, Users } from 'lucide-react';

import { C, F, Chip, useCanSeePrices, PageHero, PortalStatsStrip, type PortalStat } from './theme';
import { Button, Input } from "@/shared/ui/primitives";
import { DateFilterBar, matchesDateFilter, DEFAULT_DATE_FILTER, type DateFilterState } from "@/shared/ui/DateFilterBar";
import { DataTable, ViewToggle, type ColumnDef, type DataView } from "@/shared/ui/data";
import { useQuery } from '@tanstack/react-query';
import { customersApi } from "@/shared/api/customers";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toInitials } from "@/shared/lib/initials";

const SORTS = ["All", "Highest Spend", "Most Frequent", "Recent Visit", "Regular Only"] as const;
type Sort = typeof SORTS[number];

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  city: string;
  purchases: number;
  spend: number;
  total: string;
  lastPurchaseDate: string | null | undefined;
  last: string;
  regular: boolean;
  initials: string;
}

/**
 * The customer list. Opening one navigates to /shop/customers/:id — the full
 * record page — rather than the old modal, which could not hold the detail the
 * counter needs. Totals come from the server's aggregates, not from a page of
 * the global sales list, which used to under-count anyone whose sales fell
 * outside the first 100 rows.
 */
function CustomerProfiles({ onOpenCustomer }: { onOpenCustomer: (customerId: string) => void }) {
  const canSeePrices = useCanSeePrices();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("All");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [dataView, setDataView] = useState<DataView>("table");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shop-customers-list"],
    queryFn: () => customersApi.list(200),
  });

  const customers = useMemo<CustomerRow[]>(() => (data?.items ?? []).map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone ?? "—",
    city: c.city ?? "—",
    purchases: c.totalPurchases ?? 0,
    spend: Number(c.totalSpend ?? 0),
    total: formatMoney(rupees(Number(c.totalSpend ?? 0))),
    lastPurchaseDate: c.lastPurchaseDate,
    last: c.lastPurchaseDate
      ? new Date(c.lastPurchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "—",
    regular: c.type === "WHOLESALE",
    initials: toInitials(c.name),
  })), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = customers
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .filter(c => sort !== "Regular Only" || c.regular)
      // "All Time" is the default, so this is a no-op until a period is picked.
      .filter(c => dateFilter.mode === "all" || matchesDateFilter(c.lastPurchaseDate, dateFilter));

    const sorted = [...rows];
    if (sort === "Highest Spend") sorted.sort((a, b) => b.spend - a.spend);
    else if (sort === "Most Frequent") sorted.sort((a, b) => b.purchases - a.purchases);
    else if (sort === "Recent Visit") {
      sorted.sort((a, b) =>
        new Date(b.lastPurchaseDate ?? 0).getTime() - new Date(a.lastPurchaseDate ?? 0).getTime());
    }
    return sorted;
  }, [customers, search, sort, dateFilter]);

  const regularCount = customers.filter(c => c.regular).length;
  const activeToday = customers.filter(c =>
    c.lastPurchaseDate && new Date(c.lastPurchaseDate).toDateString() === new Date().toDateString()).length;
  const lifetime = customers.reduce((sum, c) => sum + c.spend, 0);

  const stats: PortalStat[] = [
    { label: "Total customers", value: customers.length, sub: "Registered in system", icon: Users, highlight: true },
    { label: "Regular customers", value: regularCount, sub: "Wholesale & repeat buyers", icon: Star },
    { label: "Active today", value: activeToday, sub: "Bought today", icon: ShoppingBag },
    ...(canSeePrices
      ? [{ label: "Lifetime value", value: formatMoney(rupees(lifetime)), sub: "All customers combined", icon: Users } as PortalStat]
      : []),
  ];

  const isFiltered = search.trim() !== "" || sort !== "All" || dateFilter.mode !== "all";
  const clearFilters = () => { setSearch(""); setSort("All"); setDateFilter(DEFAULT_DATE_FILTER); };

  const columns: ColumnDef<CustomerRow>[] = [
    {
      id: "name", header: "Customer", priority: 1, sortable: true,
      accessor: c => c.name,
      cell: (_v, c) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: "#FFF" }}>{c.initials}</span>
          </div>
          <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14.5, color: C.text }}>{c.name}</span>
          {c.regular && <Star size={14} fill={C.gold} color={C.gold} />}
        </div>
      ),
    },
    {
      id: "phone", header: "Phone", type: "text", priority: 2, sortable: true,
      accessor: c => c.phone,
      cell: (_v, c) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.m, fontSize: 13, color: C.muted }}>
          <Phone size={13} color={C.muted} />{c.phone}
        </span>
      ),
    },
    {
      id: "purchases", header: "Purchases", type: "number", priority: 2, sortable: true,
      accessor: c => c.purchases,
      cell: (_v, c) => <Chip label={`${c.purchases} purchases`} color={C.burg} bg="rgba(110,15,45,0.08)" />,
    },
    ...(canSeePrices ? [{
      id: "total", header: "Total spend", type: "currency" as const, priority: 2, sortable: true,
      accessor: (c: CustomerRow) => c.spend,
      cell: (_v: unknown, c: CustomerRow) => <Chip label={c.total} color={C.gold} bg="rgba(200,155,71,0.12)" />,
    } as ColumnDef<CustomerRow>] : []),
    {
      id: "last", header: "Last purchase", type: "date", priority: 2, sortable: true,
      accessor: c => c.lastPurchaseDate ?? "",
      cell: (_v, c) => <Chip label={`Last: ${c.last}`} color={C.muted} bg="rgba(139,112,96,0.08)" />,
    },
    {
      id: "actions", header: "", type: "actions", accessor: () => null,
      cell: (_v, c) => (
        <Button variant="primary" size="sm" onClick={() => onOpenCustomer(c.id)} className="h-9 gap-1.5 rounded-full bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] border-none font-semibold text-xs">
          <UserRound size={14} /> View <ArrowRight size={12} />
        </Button>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: 110 }}>
      <PageHero
        eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
        title="Customer Profiles"
        titleAccent="& History"
        description="All retail & wholesale customers — browse their purchase history, spending patterns, and contact details. Regular customers are starred for easy identification."
      />
      <PortalStatsStrip stats={stats} />

      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ marginBottom: 12 }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone" iconLeft={Search} size="lg" containerClassName="h-12 rounded-xl" />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 8 }}>
          {SORTS.map(s => (
            <Button
              key={s}
              onClick={() => setSort(s)}
              size="sm"
              className={
                "shrink-0 rounded-full px-[15px] py-2 h-auto whitespace-nowrap border font-semibold " +
                (sort === s ? "border-[#6E0F2D] bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9]" : "border-[rgba(110,15,45,0.12)] bg-transparent hover:bg-[#6E0F2D]/10 text-[#69635E] hover:text-[#6E0F2D]")
              }
            >{s}</Button>
          ))}
        </div>
        <div style={{ paddingBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          <ViewToggle value={dataView} onChange={setDataView} />
        </div>
      </div>

      <div style={{ padding: "8px 20px 0" }}>
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={c => c.id}
          caption="Shop customer profiles"
          view={dataView}
          pagination
          pageSize={12}
          loading={isLoading}
          error={isError}
          onRetry={() => void refetch()}
          isFiltered={isFiltered}
          onClearFilters={clearFilters}
          emptyTitle={customers.length === 0 ? "No customers yet" : "No customers match these filters"}
          emptyDescription={customers.length === 0 ? "Customers who make a purchase will show up here." : "Try a different search, sort, or period."}
          onRowClick={c => onOpenCustomer(c.id)}
          itemLabel="customers"
        />
      </div>
    </div>
  );
}

export { CustomerProfiles };
