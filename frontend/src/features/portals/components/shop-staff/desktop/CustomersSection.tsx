import React from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Star } from "lucide-react";
import { C, F, ShopDesktopHero, SILK_BG } from "../theme";
import { Button, Input } from "../../../../../shared/ui/primitives";
import { customersApi } from "../../../../../shared/api/customers";
import { salesApi } from "../../../../../shared/api/sales";
import { rupees, formatMoney } from "@/lib/domain/money";

type ShopCustomer = { id: string; name: string; phone: string; purchases: number; total: string; lastPurchase?: string; last?: string; initials: string; regular?: boolean; [key: string]: any };

export function CustomersSection({
  bp, isTablet, canSeePrices, setSelectedCustomer,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setSelectedCustomer: (c: ShopCustomer) => void;
}) {
  const { data: custRes } = useQuery({
    queryKey: ["shop-staff-customers"],
    queryFn: () => customersApi.list(),
  });

  const { data: salesRes } = useQuery({
    queryKey: ["shop-sales-list-customers-desktop"],
    queryFn: () => salesApi.list(100),
  });
  
  const salesList = salesRes?.items ?? [];

  const customers: ShopCustomer[] = React.useMemo(() => {
    if (!custRes?.items) return [];
    
    const salesByCustomer = new Map<string, any[]>();
    for (const sale of salesList) {
      if (!sale.customerId) continue;
      const list = salesByCustomer.get(sale.customerId) || [];
      list.push(sale);
      salesByCustomer.set(sale.customerId, list);
    }
    
    return custRes.items.map(c => {
      const customerSales = salesByCustomer.get(c.id) || [];
      const totalAmount = customerSales.reduce((acc, curr) => acc + Number(curr.amount), 0);
      
      return {
        id: c.id,
        name: c.name,
        phone: c.phone || "—",
        purchases: customerSales.length,
        total: formatMoney(rupees(totalAmount)),
        last: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—",
        regular: c.type === "WHOLESALE",
        initials: c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      };
    });
  }, [custRes, salesList]);

  const totalCustomers = customers.length;
  const regularCustomers = customers.filter(c => c.regular).length;
  const topCustomer = customers[0]?.name ?? "—";

  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · CUSTOMERS"
        titleMain="Customer Profiles"
        titleSub="& Purchase History"
        description="All retail customers — browse their history, spending patterns, and contact details. Regular customers are starred for easy identification."
        pills={[{ text: `${totalCustomers} Total Customers` }, { text: `${regularCustomers} Regular Customers`, color: C.gold }]}
        stats={[
          { label: "TOTAL CUSTOMERS", val: String(totalCustomers), sub: "Registered in system" },
          { label: "REGULAR CUSTOMERS", val: String(regularCustomers), sub: "Wholesale & repeat buyers", highlight: true },
          ...(canSeePrices ? [{ label: "RECENT SIGNUP", val: topCustomer, sub: "Latest customer" }] : []),
          { label: "PORTAL STATS", val: "Active", sub: "Live customer records", crimson: true },
        ]}
        bgUrl={SILK_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        {/* Search + filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div style={{ flex: 1 }}>
            <Input aria-label="Search by name or phone number..." placeholder="Search by name or phone number..." iconLeft={Search} size="lg" containerClassName="h-[50px] rounded-xl shadow-[0_2px_12px_rgba(44,24,16,0.06)]" />
          </div>
          {["All", "Highest Spend", "Most Frequent", "Regular Only"].map(f => (
            <Button
              key={f}
              className={
                "px-5 py-2.5 h-auto rounded-full border border-[rgba(110,15,45,0.12)] whitespace-nowrap " +
                (f === "All" ? "bg-[#6E0F2D] text-white font-semibold" : "bg-white text-[#69635E] font-normal")
              }
            >{f}</Button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 22 }}>
          {customers.map((c, i) => (
            <motion.div key={i}
              whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(44,24,16,0.14)" }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, padding: "26px 24px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", cursor: "pointer", display: "flex", flexDirection: "column" as const }}>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Last visit: <strong style={{ color: C.text }}>{c.last}</strong></div>
                <Button onClick={() => setSelectedCustomer(c)} size="sm" className="rounded-full bg-[#6E0F2D] border-none font-semibold text-[13px] text-white shadow-[0_2px_10px_rgba(110,15,45,0.28)]">
                  View Profile <ArrowRight size={13} color="#FFF" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

export type { ShopCustomer };
