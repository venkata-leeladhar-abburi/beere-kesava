import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Search, Star } from "lucide-react";
import { C, F, ShopDesktopHero, SILK_BG } from "../theme";

type ShopCustomer = { name: string; phone: string; purchases: number; total: string; lastPurchase?: string; last?: string; initials: string; regular?: boolean; [key: string]: any };

const customers: ShopCustomer[] = [
  { name: "Smt. Annapurna Devi", phone: "×××× 7823", purchases: 18, total: "₹1,84,000", last: "3 days ago", regular: true, initials: "AD" },
  { name: "Smt. Lakshmi Bai", phone: "×××× 3412", purchases: 12, total: "₹1,62,000", last: "1 week ago", regular: true, initials: "LB" },
  { name: "Sri Ramesh K.", phone: "×××× 4421", purchases: 4, total: "₹48,000", last: "2 weeks ago", regular: false, initials: "RK" },
  { name: "Smt. Padmavathi", phone: "×××× 9981", purchases: 1, total: "₹12,500", last: "Today", regular: false, initials: "PD" },
  { name: "Smt. Saraswathi", phone: "×××× 6634", purchases: 7, total: "₹84,000", last: "5 days ago", regular: true, initials: "SD" },
  { name: "Smt. Rajeshwari", phone: "×××× 2218", purchases: 2, total: "₹28,000", last: "6 months ago", regular: false, initials: "RD" },
];

export function CustomersSection({
  bp, isTablet, canSeePrices, setSelectedCustomer,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setSelectedCustomer: (c: ShopCustomer) => void;
}) {
  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · CUSTOMERS"
        titleMain="Customer Profiles"
        titleSub="& Purchase History"
        description="All retail customers — browse their history, spending patterns, and contact details. Regular customers are starred for easy identification."
        pills={[{ text: "1,284 Total Customers" }, { text: "8 New This Month", color: C.gold }, ...(canSeePrices ? [{ text: "₹1,84,000 Top Spender" }] : [])]}
        stats={[
          { label: "TOTAL CUSTOMERS", val: "1,284", sub: "All time" },
          { label: "NEW THIS MONTH", val: "8", sub: "June 2026", highlight: true },
          ...(canSeePrices ? [{ label: "TOP SPENDER", val: "₹1,84,000", sub: "Smt. Annapurna Devi" }] : []),
          { label: "REGULAR CUSTOMERS", val: "3", sub: "Shown below (starred)" },
        ]}
        bgUrl={SILK_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        {/* Search + filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <div style={{ flex: 1, position: "relative" as const }}>
            <Search size={16} color={C.muted} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }} />
            <input aria-label="Search by name or phone number..." placeholder="Search by name or phone number..." style={{ width: "100%", height: 50, background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "0 18px 0 44px", fontFamily: F.u, fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box" as const, boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }} />
          </div>
          {["All", "Highest Spend", "Most Frequent", "Regular Only"].map(f => (
            <button key={f} style={{ padding: "11px 20px", borderRadius: 999, border: `1px solid ${C.bdr}`, background: f === "All" ? C.burg : "#FFF", fontFamily: F.u, fontSize: 14, color: f === "All" ? "#FFF" : C.muted, cursor: "pointer", whiteSpace: "nowrap" as const, fontWeight: f === "All" ? 600 : 400 }}>{f}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 22 }}>
          {customers.map((c, i) => (
            <motion.div key={i}
              whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(44,24,16,0.14)" }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, padding: "26px 24px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", cursor: "pointer", display: "flex", flexDirection: "column" as const }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                <div style={{ width: 58, height: 58, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(107,26,42,0.25)" }}>
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
                  <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>PURCHASES</div>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.burg }}>{c.purchases}</div>
                </div>
                {canSeePrices && (
                  <div style={{ background: "#F8F4F0", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: 0.4, marginBottom: 4 }}>TOTAL SPENT</div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>{c.total}</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Last visit: <strong style={{ color: C.text }}>{c.last}</strong></div>
                <button onClick={() => setSelectedCustomer(c)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", boxShadow: "0 2px 10px rgba(107,26,42,0.28)" }}>
                  View Profile <ArrowRight size={13} color="#FFF" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

export type { ShopCustomer };
