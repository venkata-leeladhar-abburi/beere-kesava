

import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Modal } from "../../../../shared/ui/overlay";
import {
  X, Search, UserRound,
  Phone,
  ArrowRight, ShoppingBag, Star, Users
} from 'lucide-react';

import { C, F, Card, Chip, useCanSeePrices, PageHero, PortalStatsStrip, type PortalStat } from './theme';
import { Button, IconButton, Input } from "../../../../shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState } from "../../../../shared/ui/state";
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../../../shared/api/customers';
import { salesApi } from '../../../../shared/api/sales';
import { rupees, formatMoney } from "@/lib/domain/money";

function CustomerProfiles() {
  const canSeePrices = useCanSeePrices();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("All");
  const [selected, setSelected] = useState<number | null>(null);

  const { data: customersRes, isLoading: customersLoading, isError: customersError, refetch: refetchCustomers } = useQuery({
    queryKey: ["shop-customers-list"],
    queryFn: () => customersApi.list(100),
  });

  const { data: salesRes, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
    queryKey: ["shop-sales-list-customers"],
    queryFn: () => salesApi.list(100),
  });

  const salesList = useMemo(() => salesRes?.items ?? [], [salesRes]);

  const customers = useMemo(() => {
    const raw = customersRes?.items ?? [];
    if (raw.length === 0) return [];

    const salesByCustomer = new Map<string, typeof salesList>();
    for (const sale of salesList) {
      if (!sale.customerId) continue;
      const list = salesByCustomer.get(sale.customerId) || [];
      list.push(sale);
      salesByCustomer.set(sale.customerId, list);
    }

    return raw.map(c => {
      const parts = c.name.split(" ").filter(Boolean);
      const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : c.name.slice(0, 2).toUpperCase();
      
      const customerSales = salesByCustomer.get(c.id) || [];
      const totalAmount = customerSales.reduce((acc, curr) => acc + Number(curr.amount), 0);

      return {
        id: c.id,
        name: c.name,
        phone: c.phone ?? "—",
        city: c.city ?? "Dharmavaram",
        type: c.type,
        purchases: customerSales.length,
        total: formatMoney(rupees(totalAmount)),
        last: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "—",
        regular: c.type === "WHOLESALE",
        initials,
      };
    });
  }, [customersRes, salesList]);

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const activeCustomer = selected !== null ? customers[selected] : null;

  const activePurchases = useMemo(() => {
    if (!activeCustomer) return [];
    const customerSales = salesList.filter(s => s.customerId === activeCustomer.id);
    return customerSales.map(s => ({
      date: new Date(s.saleDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      id: s.sareeId,
      design: s.channel === "WHOLESALE" ? "Wholesale" : "Retail",
      price: formatMoney(rupees(Number(s.amount))),
      amt: formatMoney(rupees(Number(s.amount))),
      pay: "Counter"
    }));
  }, [activeCustomer, salesList]);

  const regularCount = customers.filter(c => c.regular).length;
  const todayTransactions = salesList.filter(s => new Date(s.saleDate).toDateString() === new Date().toDateString()).length;
  const topCustomer = customers[0]?.name ?? "—";

  const stats: PortalStat[] = [
    { label: "Total customers", value: customers.length, sub: "Registered in system", icon: Users, highlight: true },
    { label: "Regular customers", value: regularCount, sub: "Wholesale & repeat buyers", icon: Star },
    { label: "Active today", value: todayTransactions, sub: "Transactions today", icon: ShoppingBag },
    ...(canSeePrices ? [{ label: "Recent signup", value: topCustomer, sub: "Latest customer record", icon: Users }] : []),
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

      {/* Search + Filter */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ marginBottom: 12 }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone" iconLeft={Search} size="lg" containerClassName="h-12 rounded-xl" />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4 }}>
          {["All", "Highest Spend", "Most Frequent", "Recent Visit", "Has Returns"].map(s => (
            <Button
              key={s}
              onClick={() => setSort(s)}
              size="sm"
              className={
                "shrink-0 rounded-full px-[15px] py-2 h-auto whitespace-nowrap border " +
                (sort === s ? "border-[#6E0F2D] bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-semibold" : "border-[rgba(110,15,45,0.12)] bg-transparent hover:bg-[#6E0F2D]/10 text-[#69635E] hover:text-[#6E0F2D] font-semibold")
              }
            >{s}</Button>
          ))}
        </div>
      </div>

      {(customersLoading || salesLoading) ? (
        <div style={{ padding: "8px 20px 0" }}><LoadingState variant="skeleton" rows={4} /></div>
      ) : (customersError || salesError) ? (
        <div style={{ padding: "8px 20px 0" }}>
          <ErrorState error={undefined} onRetry={() => { void refetchCustomers(); void refetchSales(); }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "8px 20px 0" }}>
          <EmptyState title="No customers yet" description="Customers who make a purchase will show up here." />
        </div>
      ) : (
      <div style={{ padding: "8px 20px 0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((c, i) => (
          <Card key={c.id} style={{ padding: 20 }}>
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
            <Button variant="primary" onClick={() => setSelected(i)} fullWidth className="h-[46px] gap-2 rounded-full bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] border-none font-semibold text-sm shadow-[0_2px_10px_rgba(110,15,45,0.28)]">
              <UserRound size={16} /> View Profile <ArrowRight size={14} />
            </Button>
          </Card>
        ))}
      </div>
      )}

      {/* ══════ MODAL: CUSTOMER PROFILE ══════ */}
      <Modal open={!!activeCustomer} onOpenChange={o => !o && setSelected(null)} size="sm">
        {activeCustomer && (
          <>
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "16px 20px 24px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.burg, border: "3px solid rgba(200,155,71,0.50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 20px rgba(110,15,45,0.40)" }}>
                    <span style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: "#FFF" }}>{activeCustomer.initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                      <Dialog.Title asChild>
                        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", lineHeight: 1.2 }}>{activeCustomer.name}</div>
                      </Dialog.Title>
                      {activeCustomer.regular && <Star size={16} fill={C.gold} color={C.gold} />}
                    </div>
                    <Dialog.Description asChild><div style={{ fontFamily: F.m, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{activeCustomer.phone}</div></Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <IconButton
                      icon={X}
                      label="Close"
                      variant="ghost"
                      shape="circle"
                      className="bg-white/10 text-white/70 w-9 h-9 shrink-0"
                    />
                  </Dialog.Close>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: "22px 20px 24px", overflowY: "auto" as const }}>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3" style={{ display: "grid", gap: 10, marginBottom: 24 }}>
                  {[
                    { label: "Purchases", val: `${activeCustomer.purchases}`, color: C.burg },
                    ...(canSeePrices ? [{ label: "Total Spent", val: activeCustomer.total, color: C.gold }] : []),
                    { label: "Last Visit", val: activeCustomer.last, color: C.text },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#F8F4F0", borderRadius: 14, padding: "12px 10px", textAlign: "center" as const }}>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" as const, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: s.color, lineHeight: 1.25 }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                {/* Recent purchases */}
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} /> Purchase History ({activePurchases.length})
                </div>
                {activePurchases.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < activePurchases.length - 1 ? `1px solid rgba(110,15,45,0.08)` : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ShoppingBag size={17} color={C.burg} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.m, fontSize: 12, color: C.burg, marginBottom: 2 }}>{p.id}</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{p.design}</div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.date}</div>
                    </div>
                    {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16, color: C.gold, flexShrink: 0 }}>{p.price}</div>}
                  </div>
                ))}

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                  <Button fullWidth className="h-[52px] rounded-full border-none bg-[#6E0F2D] font-bold text-sm text-white gap-2 shadow-[0_4px_16px_rgba(110,15,45,0.30)]">
                    <ShoppingBag size={17} /> Record New Sale
                  </Button>
                  <Button onClick={() => setSelected(null)} fullWidth className="h-[50px] rounded-full border-[1.5px] border-[rgba(110,15,45,0.12)] bg-white font-semibold text-sm text-[#69635E]">Close</Button>
                </div>
              </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─── PAGE 06 — SALES REPORT ──────────────────────────────────────────────────
export { CustomerProfiles };
