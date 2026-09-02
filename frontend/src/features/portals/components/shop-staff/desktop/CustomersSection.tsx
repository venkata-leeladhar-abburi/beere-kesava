import React from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Star, Users, ShoppingBag } from "lucide-react";
import { C, F, PageHero, PortalStatsStrip, type PortalStat } from "../theme";
import { Button, Input } from "@/shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState } from "@/shared/ui/state";
import { Pagination, usePagination } from "@/shared/ui/DataPagination";
import { DateFilterBar, matchesDateFilter, DEFAULT_DATE_FILTER, type DateFilterState } from "@/shared/ui/DateFilterBar";
import { customersApi } from "@/shared/api/customers";
import { rupees, formatMoney } from "@/lib/domain/money";
import { toInitials } from "@/shared/lib/initials";

type ShopCustomer = {
  id: string; name: string; phone: string; purchases: number; spend: number;
  total: string; last: string; lastPurchaseDate: string | null; initials: string; regular: boolean;
};

const FILTERS = ["All", "Highest Spend", "Most Frequent", "Recent Visit", "Regular Only"] as const;
type Filter = typeof FILTERS[number];

export function CustomersSection({
  isTablet, canSeePrices, onOpenCustomer,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  onOpenCustomer: (customerId: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("All");
  const [dateFilter, setDateFilter] = React.useState<DateFilterState>(DEFAULT_DATE_FILTER);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shop-staff-customers"],
    queryFn: () => customersApi.list(200),
  });

  // Purchase count / lifetime spend / last visit are computed server-side off
  // SaleRecord, so they stay right no matter how many sales the shop has.
  const customers: ShopCustomer[] = React.useMemo(() => (data?.items ?? []).map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone || "—",
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

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = customers
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .filter(c => filter !== "Regular Only" || c.regular)
      .filter(c => dateFilter.mode === "all" || matchesDateFilter(c.lastPurchaseDate, dateFilter));

    const sorted = [...rows];
    if (filter === "Highest Spend") sorted.sort((a, b) => b.spend - a.spend);
    else if (filter === "Most Frequent") sorted.sort((a, b) => b.purchases - a.purchases);
    else if (filter === "Recent Visit") {
      sorted.sort((a, b) =>
        new Date(b.lastPurchaseDate ?? 0).getTime() - new Date(a.lastPurchaseDate ?? 0).getTime());
    }
    return sorted;
  }, [customers, search, filter, dateFilter]);

  const pag = usePagination(filtered, 12);

  const regularCustomers = customers.filter(c => c.regular).length;
  const activeTodayCount = customers.filter(c =>
    c.lastPurchaseDate && new Date(c.lastPurchaseDate).toDateString() === new Date().toDateString()).length;
  const lifetime = customers.reduce((sum, c) => sum + c.spend, 0);

  const stats: PortalStat[] = [
    { label: "Total customers", value: customers.length, sub: "Registered in system", icon: Users, highlight: true },
    { label: "Regular customers", value: regularCustomers, sub: "Wholesale & repeat buyers", icon: Star },
    { label: "Active today", value: activeTodayCount, sub: "Bought today", icon: ShoppingBag },
    ...(canSeePrices
      ? [{ label: "Lifetime value", value: formatMoney(rupees(lifetime)), sub: "All customers combined", icon: Users } as PortalStat]
      : []),
  ];

  return (
    <>
      <PageHero
        eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
        title="Customer Profiles"
        titleAccent="& History"
        description="All retail & wholesale customers — browse their purchase history, spending patterns, and contact details. Regular customers are starred for easy identification."
      />
      <PortalStatsStrip stats={stats} />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        {/* Search + filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px", minWidth: 220 }}>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search by name or phone number"
              placeholder="Search by name or phone number..."
              iconLeft={Search}
              size="lg"
              containerClassName="h-[50px] rounded-xl shadow-[0_2px_12px_rgba(44,24,16,0.06)]"
            />
          </div>
          {FILTERS.map(f => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "px-5 py-2.5 h-auto rounded-full border border-[rgba(110,15,45,0.12)] whitespace-nowrap " +
                (filter === f ? "bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-semibold" : "bg-white hover:bg-[rgba(110,15,45,0.06)] text-[#69635E] hover:text-[#6E0F2D] font-normal")
              }
            >{f}</Button>
          ))}
        </div>
        <div style={{ marginBottom: 28 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>

        {isLoading ? (
          <LoadingState variant="skeleton" rows={4} />
        ) : isError ? (
          <ErrorState error={undefined} onRetry={() => { void refetch(); }} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={customers.length === 0 ? "No customers yet" : "No customers match these filters"}
            description={customers.length === 0 ? "Customers who make a purchase will show up here." : "Try a different search, filter, or period."}
          />
        ) : (
        <>
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 22 }}>
          {pag.pageItems.map((c) => (
            <motion.div key={c.id}
              onClick={() => onOpenCustomer(c.id)}
              style={{ background: "#FFF", borderRadius: 18, border: `1.5px solid ${C.gold}`, padding: "26px 24px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", cursor: "pointer", display: "flex", flexDirection: "column" as const }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                <div style={{ width: 58, height: 58, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(110,15,45,0.25)" }}>
                  <span style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: "#FFF" }}>{c.initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.name}</div>
                  <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{c.phone}</div>
                </div>
                {c.regular && <Star size={20} fill={C.gold} color={C.gold} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: canSeePrices ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 18 }}>
                <div style={{ background: "#F8F4F0", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>PURCHASES</div>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.burg }}>{c.purchases}</div>
                </div>
                {canSeePrices && (
                  <div style={{ background: "#F8F4F0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>TOTAL SPENT</div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>{c.total}</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: "auto" }}>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Last visit: <strong style={{ color: C.text }}>{c.last}</strong></div>
                <Button
                  variant="primary"
                  onClick={e => { e.stopPropagation(); onOpenCustomer(c.id); }}
                  size="sm"
                  className="rounded-full bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] border-none font-semibold text-[13px] shadow-[0_2px_10px_rgba(110,15,45,0.28)]"
                >
                  View Profile <ArrowRight size={13} color="#FFF" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
        <Pagination
          page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="customers"
        />
        </>
        )}
      </div>
    </>
  );
}

export type { ShopCustomer };
