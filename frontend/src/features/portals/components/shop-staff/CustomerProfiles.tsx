import { useMemo, useState } from 'react';
import { Search, UserRound, Phone, ArrowRight, ShoppingBag, Star, Users } from 'lucide-react';

import { C, F, Card, Chip, useCanSeePrices, PageHero, PortalStatsStrip, type PortalStat } from './theme';
import { Button, Input } from "@/shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState } from "@/shared/ui/state";
import { Pagination, usePagination } from "@/shared/ui/DataPagination";
import { DateFilterBar, matchesDateFilter, DEFAULT_DATE_FILTER, type DateFilterState } from "@/shared/ui/DateFilterBar";
import { useQuery } from '@tanstack/react-query';
import { customersApi } from "@/shared/api/customers";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toInitials } from "@/shared/lib/initials";

const SORTS = ["All", "Highest Spend", "Most Frequent", "Recent Visit", "Regular Only"] as const;
type Sort = typeof SORTS[number];

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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shop-customers-list"],
    queryFn: () => customersApi.list(200),
  });

  const customers = useMemo(() => (data?.items ?? []).map(c => ({
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

  const pag = usePagination(filtered, 12);

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
        <div style={{ paddingBottom: 4 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "8px 20px 0" }}><LoadingState variant="skeleton" rows={4} /></div>
      ) : isError ? (
        <div style={{ padding: "8px 20px 0" }}><ErrorState error={undefined} onRetry={() => { void refetch(); }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "8px 20px 0" }}>
          <EmptyState
            title={customers.length === 0 ? "No customers yet" : "No customers match these filters"}
            description={customers.length === 0 ? "Customers who make a purchase will show up here." : "Try a different search, sort, or period."}
          />
        </div>
      ) : (
        <>
          <div style={{ padding: "8px 20px 0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {pag.pageItems.map(c => (
              <Card key={c.id} style={{ padding: 20, border: `1.5px solid ${C.gold}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#FFF" }}>{c.initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.text }}>{c.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <Phone size={13} color={C.muted} />
                      <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{c.phone}</span>
                    </div>
                  </div>
                  {c.regular && <Star size={20} fill={C.gold} color={C.gold} />}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 16 }}>
                  <Chip label={`${c.purchases} purchases`} color={C.burg} bg="rgba(110,15,45,0.08)" />
                  {canSeePrices && <Chip label={c.total} color={C.gold} bg="rgba(200,155,71,0.12)" />}
                  <Chip label={`Last: ${c.last}`} color={C.muted} bg="rgba(139,112,96,0.08)" />
                </div>
                <Button variant="primary" onClick={() => onOpenCustomer(c.id)} fullWidth className="h-[46px] gap-2 rounded-full bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] border-none font-semibold text-sm shadow-[0_2px_10px_rgba(110,15,45,0.28)]">
                  <UserRound size={16} /> View Profile <ArrowRight size={14} />
                </Button>
              </Card>
            ))}
          </div>
          <div style={{ padding: "0 20px" }}>
            <Pagination
              page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
              onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="customers"
            />
          </div>
        </>
      )}
    </div>
  );
}

export { CustomerProfiles };
