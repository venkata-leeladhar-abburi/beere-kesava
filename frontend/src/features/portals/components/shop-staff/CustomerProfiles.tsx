

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown, ShoppingBag, Star
} from 'lucide-react';

import { C, F, TEAL, Card, Btn, Chip, CUSTOMER_PURCHASES, useCanSeePrices } from './theme';
function CustomerProfiles() {
  const canSeePrices = useCanSeePrices();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("All");
  const [selected, setSelected] = useState<number | null>(null);

  const customers = [
    { name: "Smt. Annapurna Devi", phone: "×××× 7823", purchases: 18, total: "₹1,84,000", last: "3 days ago", regular: true, initials: "AD" },
    { name: "Smt. Lakshmi Bai", phone: "×××× 3412", purchases: 12, total: "₹1,62,000", last: "1 week ago", regular: true, initials: "LB" },
    { name: "Sri Ramesh K.", phone: "×××× 4421", purchases: 4, total: "₹48,000", last: "2 weeks ago", regular: false, initials: "RK" },
    { name: "Smt. Padmavathi", phone: "×××× 9981", purchases: 1, total: "₹12,500", last: "Today", regular: false, initials: "PD" },
    { name: "Smt. Saraswathi", phone: "×××× 6634", purchases: 7, total: "₹84,000", last: "5 days ago", regular: true, initials: "SD" },
    { name: "Smt. Rajeshwari", phone: "×××× 2218", purchases: 2, total: "₹28,000", last: "6 months ago", regular: false, initials: "RD" },
  ];

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const activeCustomer = selected !== null ? customers[selected] : null;

  const activePurchases = activeCustomer ? (CUSTOMER_PURCHASES[activeCustomer.name] || []) : [];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · CUSTOMER PROFILES</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 34, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Customer Profiles</div>
        <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold }}>All retail customers</div>
      </div>

      {/* Stats — stacked cards, no wrapping/truncation */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, padding: "16px 20px 4px" }}>
        <div style={{ flex: "1 1 100%", background: C.dark, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: C.gold, marginBottom: 6 }}>Total Customers</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold, lineHeight: 1 }}>242</div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "right" as const }}>Active this year</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(107,26,42,0.08)", border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: C.text, marginBottom: 6 }}>New Signups</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 21, color: C.text, lineHeight: 1.2 }}>+14</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(26,10,15,0.55)", marginTop: 4 }}>June 2026</div>
        </div>
        {canSeePrices ? (
          <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(196,146,58,0.12)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: C.burg, marginBottom: 6 }}>Top Spender</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 21, color: C.burg, lineHeight: 1.2 }}>₹1,84,000</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Smt. Annapurna</div>
          </div>
        ) : (
          <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(196,146,58,0.12)", border: `1px solid rgba(196,146,58,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12.5, color: C.burg, marginBottom: 6 }}>Most Frequent</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 21, color: C.burg, lineHeight: 1.2 }}>18 visits</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Smt. Annapurna</div>
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ position: "relative" as const, marginBottom: 12 }}>
          <Search size={18} color={C.muted} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone" style={{ width: "100%", height: 48, background: C.inp, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px 0 42px", fontFamily: F.u, fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4 }}>
          {["All", "Highest Spend", "Most Frequent", "Recent Visit", "Has Returns"].map(s => (
            <button key={s} onClick={() => setSort(s)} style={{ flexShrink: 0, padding: "8px 15px", borderRadius: 999, border: `1px solid ${sort === s ? C.burg : C.bdr}`, background: sort === s ? C.burg : "transparent", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: sort === s ? "#FFF" : C.muted, cursor: "pointer", whiteSpace: "nowrap" as const }}>{s}</button>
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
            <button onClick={() => setSelected(i)} style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer", boxShadow: "0 2px 10px rgba(107,26,42,0.28)" }}>
              <UserRound size={16} /> View Profile <ArrowRight size={14} />
            </button>
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
                    <span style={{ fontFamily: F.d, fontSize: 22, fontWeight: 700, color: "#FFF" }}>{activeCustomer.initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", lineHeight: 1.2 }}>{activeCustomer.name}</div>
                      {activeCustomer.regular && <Star size={16} fill={C.gold} color={C.gold} />}
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{activeCustomer.phone}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <X size={18} color="rgba(255,255,255,0.70)" />
                  </button>
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
                      <div style={{ fontFamily: F.u, fontSize: 10.5, color: C.muted, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" as const, marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: s.color, lineHeight: 1.25 }}>{s.val}</div>
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
                      <div style={{ fontFamily: F.m, fontSize: 12.5, color: C.burg, marginBottom: 2 }}>{p.id}</div>
                      <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.text }}>{p.design}</div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.date}</div>
                    </div>
                    {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16, color: C.gold, flexShrink: 0 }}>{p.price}</div>}
                  </div>
                ))}
                {/* Frequency Analysis */}
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, margin: "20px 0 12px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} /> Frequency Analysis
                </div>
                <div style={{ background: "#F8F4F0", borderRadius: 14, padding: "6px 16px", marginBottom: 24 }}>
                  {[
                    ["Visits per month", "1.5 average"],
                    ["Last visit", activeCustomer.last],
                    ["Preferred design", "BKB-045"],
                  ].map(([k, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
                      <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{k}</span>
                      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                  <button style={{ width: "100%", height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                    <ShoppingBag size={17} /> Record New Sale
                  </button>
                  <button onClick={() => setSelected(null)} style={{ width: "100%", height: 50, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "pointer" }}>Close</button>
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
