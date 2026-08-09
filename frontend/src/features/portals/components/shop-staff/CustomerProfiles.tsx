

import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown, ShoppingBag, Star
} from 'lucide-react';

import { C, F, TEAL, Card, Btn, Chip, CUSTOMER_PURCHASES, useCanSeePrices } from './theme';
import { Button, IconButton, Input } from "../../../../shared/ui/primitives";
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../../../shared/api/customers';
import { salesApi } from '../../../../shared/api/sales';

function CustomerProfiles() {
  const canSeePrices = useCanSeePrices();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("All");
  const [selected, setSelected] = useState<number | null>(null);

  const { data: customersRes } = useQuery({
    queryKey: ["shop-customers-list"],
    queryFn: () => customersApi.list(100),
  });

  const { data: salesRes } = useQuery({
    queryKey: ["shop-sales-list-customers"],
    queryFn: () => salesApi.list(100),
  });

  const salesList = salesRes?.items ?? [];

  const customers = useMemo(() => {
    const raw = customersRes?.items ?? [];
    if (raw.length === 0) return [];

    const salesByCustomer = new Map<string, any[]>();
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
        total: `₹${totalAmount.toLocaleString('en-IN')}`,
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
      price: `₹${Number(s.amount).toLocaleString('en-IN')}`,
      amt: `₹${Number(s.amount).toLocaleString('en-IN')}`,
      pay: "Counter"
    }));
  }, [activeCustomer, salesList]);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · CUSTOMER PROFILES</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Customer Profiles</div>
        <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold }}>All retail customers</div>
      </div>

      {/* Stats — stacked cards, no wrapping/truncation */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, padding: "16px 20px 4px" }}>
        <div style={{ flex: "1 1 100%", background: C.dark, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.gold, marginBottom: 6 }}>Total Customers</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold, lineHeight: 1 }}>{customers.length}</div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "right" as const }}>Active this year</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(107,26,42,0.08)", border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.text, marginBottom: 6 }}>Regular Customers</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, lineHeight: 1.2 }}>{customers.filter(c => c.regular).length}</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(26,10,15,0.55)", marginTop: 4 }}>Wholesale & repeat</div>
        </div>
        {canSeePrices ? (
          <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(196,146,58,0.12)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.burg, marginBottom: 6 }}>Active Today</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.burg, lineHeight: 1.2 }}>{salesList.filter(s => new Date(s.saleDate).toDateString() === new Date().toDateString()).length}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Transactions</div>
          </div>
        ) : (
          <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(196,146,58,0.12)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.burg, marginBottom: 6 }}>Active Today</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.burg, lineHeight: 1.2 }}>{salesList.filter(s => new Date(s.saleDate).toDateString() === new Date().toDateString()).length}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Transactions</div>
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div style={{ padding: "16px 20px 8px" }}>
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
                (sort === s ? "border-[#6B1A2A] bg-[#6B1A2A] text-white font-semibold" : "border-[rgba(139,26,46,0.12)] bg-transparent text-[#69635E] font-semibold")
              }
            >{s}</Button>
          ))}
        </div>
      </div>

      <div style={{ padding: "8px 20px 0", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((c, i) => (
          <Card key={i} style={{ padding: 20 }}>
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
              <Chip label={`${c.purchases} purchases`} color={C.burg} bg="rgba(107,26,42,0.08)" />
              {canSeePrices && <Chip label={c.total} color={C.gold} bg="rgba(196,146,58,0.12)" />}
              <Chip label={`Last: ${c.last}`} color={C.muted} bg="rgba(139,112,96,0.08)" />
            </div>
            <Button onClick={() => setSelected(i)} fullWidth className="h-[46px] gap-2 rounded-full bg-[#6B1A2A] border-none font-semibold text-sm text-white shadow-[0_2px_10px_rgba(107,26,42,0.28)]">
              <UserRound size={16} /> View Profile <ArrowRight size={14} />
            </Button>
          </Card>
        ))}
      </div>

      {/* ══════ MODAL: CUSTOMER PROFILE ══════ */}
      <AnimatePresence>
        {activeCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#FFF", borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88vh", boxShadow: "0 -8px 40px rgba(44,24,16,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, flexShrink: 0, background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)` }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.30)" }} />
              </div>
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "16px 20px 24px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.burg, border: "3px solid rgba(196,146,58,0.50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 20px rgba(107,26,42,0.40)" }}>
                    <span style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: "#FFF" }}>{activeCustomer.initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", lineHeight: 1.2 }}>{activeCustomer.name}</div>
                      {activeCustomer.regular && <Star size={16} fill={C.gold} color={C.gold} />}
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{activeCustomer.phone}</div>
                  </div>
                  <IconButton
                    icon={X}
                    label="Close"
                    onClick={() => setSelected(null)}
                    variant="ghost"
                    shape="circle"
                    className="bg-white/10 text-white/70 w-9 h-9 shrink-0"
                  />
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: "22px 20px 24px", overflowY: "auto" as const }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
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
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < activePurchases.length - 1 ? `1px solid rgba(107,26,42,0.08)` : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(107,26,42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                  <Button fullWidth className="h-[52px] rounded-full border-none bg-[#6B1A2A] font-bold text-sm text-white gap-2 shadow-[0_4px_16px_rgba(107,26,42,0.30)]">
                    <ShoppingBag size={17} /> Record New Sale
                  </Button>
                  <Button onClick={() => setSelected(null)} fullWidth className="h-[50px] rounded-full border-[1.5px] border-[rgba(139,26,46,0.12)] bg-white font-semibold text-sm text-[#69635E]">Close</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PAGE 06 — SALES REPORT ──────────────────────────────────────────────────
export { CustomerProfiles };
