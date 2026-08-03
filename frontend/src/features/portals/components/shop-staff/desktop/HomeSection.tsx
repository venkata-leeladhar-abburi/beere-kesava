import React from "react";
import { AlertTriangle, ArrowRight, ArrowUpRight, BarChart2, Check, Package, RotateCcw, Send, ShoppingBag, Users } from "lucide-react";
import { C, F, ShopDesktopHero, SHOP_BG } from "../theme";
import { DSH } from "./DSH";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

const recentSales = [
  { id: "PADMA-L1-004", customer: "Smt. Annapurna", design: "BKB-045 · Cream Zari Border", amt: "₹8,500", time: "11:42 AM", color: "#E8D5B0", pay: "UPI", ext: false },
  { id: "RAVI-L2-008", customer: "Sri Ramesh K.", design: "BKB-031 · Red Silk Kanjivaram", amt: "₹12,000", time: "10:30 AM", color: "#8B2020", pay: "Card", ext: false },
  { id: "BKB-L3-002", customer: "Smt. Lakshmi", design: "BKB-022 · Green Peacock", amt: "₹5,500", time: "9:45 AM", color: "#1E6640", pay: "Cash", ext: false },
  { id: "EXT-RAVI-001", customer: "Smt. Padmavathi", design: "External Silk · Checks", amt: "₹6,200", time: "9:20 AM", color: "#C9A86C", pay: "UPI", ext: true },
  { id: "PADMA-L1-003", customer: "Smt. Saraswathi", design: "BKB-045 · Cream Zari Border", amt: "₹8,500", time: "Yesterday 4:30 PM", color: "#E8D5B0", pay: "Cash", ext: false },
];

export function HomeSection({
  bp, isTablet, canSeePrices, setActive, setShowReturn, invLowStockSent, setShowInvLowStockDialog,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setActive: (tab: TabId) => void; setShowReturn: (v: boolean) => void;
  invLowStockSent: boolean; setShowInvLowStockDialog: (v: boolean) => void;
}) {
  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · OVERVIEW"
        titleMain="Shop Home"
        titleSub="& Today's Overview"
        description="Today's sales, current inventory, and quick actions for the shop counter. Track every transaction and customer in real time."
        pills={[{ text: "12 Sales Today", color: C.gold }, ...(canSeePrices ? [{ text: "₹1,04,000 Revenue" }] : []), { text: "84 Sarees in Stock" }, { text: "1 Return Processed" }]}
        alertBadge="Priya Sharma · Shop Staff"
        stats={[
          { label: "TODAY'S SALES", val: "12", sub: "↑ 3 more than yesterday" },
          ...(canSeePrices ? [{ label: "TODAY'S REVENUE", val: "₹1,04,000", sub: "From 12 sales", highlight: true }] : []),
          { label: "SHOP INVENTORY", val: "84", sub: "Sarees currently in stock" },
          { label: "RETURNS TODAY", val: "1", sub: "Processed and recorded", crimson: true },
        ]}
        bgUrl={SHOP_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 380px", gap: isTablet ? 24 : 36, alignItems: "start" }}>
          {/* Left */}
          <div>
            {/* New Sale CTA */}
            <div style={{ background: "#FFF", border: `2px solid ${C.burg}`, borderRadius: 20, padding: "28px 30px", marginBottom: 28, display: "flex", alignItems: "center", gap: 22, boxShadow: "0 4px 24px rgba(107,26,42,0.10)" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(196,146,58,0.35)" }}>
                <ShoppingBag size={34} color={C.dark} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 28, color: C.text, marginBottom: 6 }}>New Retail Sale</div>
                <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted }}>Record a sale at the counter — scan saree barcode, select payment, generate bill</div>
              </div>
              <button onClick={() => setActive("sale")} style={{ height: 56, padding: "0 28px", borderRadius: 999, background: C.burg, border: "none", fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                <ArrowUpRight size={18} /> Start New Sale
              </button>
            </div>

            {/* Recent Sales */}
            <DSH label="Recent Sales — Today" link="View All →" onLink={() => setActive("reports")} />
            <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, overflow: isTablet ? "auto" : "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 32 }}>
              <div style={{ minWidth: isTablet ? 640 : undefined }}>
                <div style={{ display: "grid", gridTemplateColumns: `1fr 1fr 120px 80px${canSeePrices ? " 100px" : ""}`, padding: "14px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                  {["Saree ID", "Customer", "Design", "Payment", ...(canSeePrices ? ["Amount"] : [])].map(h => (
                    <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                  ))}
                </div>
                {recentSales.map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: `1fr 1fr 120px 80px${canSeePrices ? " 100px" : ""}`, padding: "18px 24px", borderBottom: i < recentSales.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 8, height: 36, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.id}</div>
                        {s.ext && <span style={{ fontFamily: F.u, fontSize: 10, fontWeight: 600, color: C.gold, background: "rgba(196,146,58,0.12)", padding: "1px 7px", borderRadius: 999 }}>External</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>{s.customer}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.design.split("·")[0]?.trim()}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.pay}</div>
                    {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Returns Today */}
            <DSH label="Returns Today" />
            <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.crim}`, borderRadius: 16, padding: "22px 26px", boxShadow: "0 3px 16px rgba(44,24,16,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <RotateCcw size={22} color={C.crim} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.m, fontSize: 15, fontWeight: 700, color: C.burg, marginBottom: 4 }}>RAVI-L2-007</div>
                  <div style={{ fontFamily: F.u, fontSize: 15, color: C.text }}>Wrong Design · Smt. Meenakshi{canSeePrices ? " · ₹12,000" : ""}</div>
                </div>
                <div>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginBottom: 4 }}>9:10 AM</div>
                  <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.crim, background: "rgba(192,57,43,0.10)", padding: "3px 12px", borderRadius: 999 }}>Return</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
            {/* Stock Alert */}
            <div style={{ background: "rgba(192,57,43,0.06)", border: `2px solid rgba(192,57,43,0.30)`, borderRadius: 18, padding: "24px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <AlertTriangle size={24} color={C.crim} />
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.crim }}>Stock Alert</div>
              </div>
              <div style={{ fontFamily: F.u, fontSize: 15, color: C.text, marginBottom: 6 }}>Only <strong>84 sarees</strong> remaining in shop stock.</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 18 }}>Stock is running low. Notify admin to arrange restocking from factory.</div>
              {invLowStockSent ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.25)", borderRadius: 12, padding: "12px 16px" }}>
                  <Check size={18} color={C.green} />
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.green }}>Admin & Superadmin have been notified</span>
                </div>
              ) : (
                <button onClick={() => setShowInvLowStockDialog(true)} style={{ width: "100%", height: 48, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Send size={16} /> Report Low Stock to Admin
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: C.dark, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(61,14,26,0.20)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 4 }}>QUICK ACTIONS</div>
                <div style={{ fontFamily: F.u, fontSize: 15, color: "rgba(255,255,255,0.70)" }}>Navigate to key operations</div>
              </div>
              {[
                { label: "New Retail Sale", sub: "Record a sale at counter", tab: "sale" as TabId, icon: <ShoppingBag size={18} color={C.gold} /> },
                { label: "Shop Inventory", sub: "View all sarees in stock", tab: "inventory" as TabId, icon: <Package size={18} color={C.gold} /> },
                { label: "Customer Profiles", sub: "Browse customer records", tab: "customers" as TabId, icon: <Users size={18} color={C.gold} /> },
                { label: "Sales Reports", sub: "Analytics and trends", tab: "reports" as TabId, icon: <BarChart2 size={18} color={C.gold} /> },
              ].map((a, i) => (
                <button key={a.tab} onClick={() => setActive(a.tab)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "17px 24px", border: "none", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none", background: "transparent", cursor: "pointer", textAlign: "left" as const }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(196,146,58,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: "#FFF", marginBottom: 2 }}>{a.label}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{a.sub}</div>
                  </div>
                  <ArrowRight size={15} color="rgba(255,255,255,0.30)" />
                </button>
              ))}
              <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <button onClick={() => setShowReturn(true)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" as const }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(192,57,43,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <RotateCcw size={18} color={C.crim} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: "#FFF", marginBottom: 2 }}>Process Return</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Handle customer returns</div>
                  </div>
                  <ArrowRight size={15} color="rgba(255,255,255,0.30)" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
