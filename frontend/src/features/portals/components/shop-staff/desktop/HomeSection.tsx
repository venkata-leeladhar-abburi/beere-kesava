import React from "react";
import { AlertTriangle, ArrowRight, ArrowUpRight, BarChart2, Check, Package, RotateCcw, Send, ShoppingBag, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../../shared/api/sales";
import { inventoryApi } from "../../../../../shared/api/inventory";
import { customersApi } from "../../../../../shared/api/customers";
import { useAuth } from "../../../../../contexts/AuthContext";
import { C, F, ShopDesktopHero, SHOP_BG } from "../theme";
import { DSH } from "./DSH";
import { Button } from "../../../../../shared/ui/primitives";
import { rupees, formatMoney } from "@/lib/domain/money";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

function dateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function HomeSection({
  bp, isTablet, canSeePrices, setActive, setShowReturn, invLowStockSent, setShowInvLowStockDialog,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setActive: (tab: TabId) => void; setShowReturn: (v: boolean) => void;
  invLowStockSent: boolean; setShowInvLowStockDialog: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-homesection"],
    queryFn: () => salesApi.list(100),
  });

  const { data: inventoryRes } = useQuery({
    queryKey: ["inventory-list-homesection"],
    queryFn: () => inventoryApi.list(),
  });

  const { data: returnsRes } = useQuery({
    queryKey: ["returns-list-homesection"],
    queryFn: () => salesApi.listReturns(100),
  });

  const { data: customersRes } = useQuery({
    queryKey: ["customers-homesection"],
    queryFn: () => customersApi.list(100),
  });

  const salesList = salesRes?.items ?? [];
  const inventoryList = inventoryRes ?? [];
  const returnsList = returnsRes?.items ?? [];
  const customerMap = new Map((customersRes?.items ?? []).map(c => [c.id, c.name]));

  const todayStr = new Date().toDateString();
  const todaySales = salesList.filter(s => new Date(s.saleDate).toDateString() === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.amount), 0);
  const todayReturns = returnsList.filter(r => new Date(r.returnDate).toDateString() === todayStr);

  const recentSales = salesList.slice(0, 5).map(s => ({
    id: s.sareeId,
    customer: s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Retail Counter",
    design: s.channel === "WHOLESALE" ? "Wholesale" : "Retail",
    pay: "Counter",
    amt: formatMoney(rupees(Number(s.amount))),
    time: dateLabel(s.saleDate),
    color: "#6B1A2A",
    ext: false,
  }));

  const latestReturn = returnsList[0];
  const staffName = user?.name || "Shop Staff";

  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · OVERVIEW"
        titleMain="Shop Home"
        titleSub="& Today's Overview"
        description="Today's sales, current inventory, and quick actions for the shop counter. Track every transaction and customer in real time."
        pills={[{ text: `${todaySales.length} Sales Today`, color: C.gold }, ...(canSeePrices ? [{ text: `${formatMoney(rupees(todayRevenue))} Revenue` }] : []), { text: `${inventoryList.length} Sarees in Stock` }, { text: `${todayReturns.length} Return${todayReturns.length !== 1 ? "s" : ""} Processed` }]}
        alertBadge={`${staffName} · Shop Staff`}
        stats={[
          { label: "TODAY'S SALES", val: String(todaySales.length), sub: "Recorded today" },
          ...(canSeePrices ? [{ label: "TODAY'S REVENUE", val: formatMoney(rupees(todayRevenue)), sub: `From ${todaySales.length} sales`, highlight: true }] : []),
          { label: "SHOP INVENTORY", val: String(inventoryList.length), sub: "Sarees currently in stock" },
          { label: "RETURNS TODAY", val: String(todayReturns.length), sub: "Processed and recorded", crimson: true },
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
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.text, marginBottom: 6 }}>New Retail Sale</div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Record a sale at the counter — scan saree barcode, select payment, generate bill</div>
              </div>
              <Button onClick={() => setActive("sale")} className="h-14 px-7 rounded-full bg-[#6B1A2A] border-none font-bold text-base text-white gap-2 shrink-0 shadow-[0_4px_16px_rgba(107,26,42,0.30)]">
                <ArrowUpRight size={18} /> Start New Sale
              </Button>
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
                {recentSales.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
                    No sales recorded today yet.
                  </div>
                ) : (
                  recentSales.map((s, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: `1fr 1fr 120px 80px${canSeePrices ? " 100px" : ""}`, padding: "18px 24px", borderBottom: i < recentSales.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 8, height: 36, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.id}</div>
                          {s.ext && <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold, background: "rgba(196,146,58,0.12)", padding: "1px 7px", borderRadius: 999 }}>External</span>}
                        </div>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>{s.customer}</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.design}</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.pay}</div>
                      {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Returns Today */}
            <DSH label="Returns Today" />
            <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderLeft: `6px solid ${C.crim}`, borderRadius: 16, padding: "22px 26px", boxShadow: "0 3px 16px rgba(44,24,16,0.07)" }}>
              {latestReturn ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <RotateCcw size={22} color={C.crim} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg, marginBottom: 4 }}>{latestReturn.sareeId}</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>
                      {latestReturn.reason}
                      {canSeePrices && latestReturn.refundAmount ? ` · ${formatMoney(rupees(Number(latestReturn.refundAmount)))}` : ""}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginBottom: 4 }}>{dateLabel(latestReturn.returnDate)}</div>
                    <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.crim, background: "rgba(192,57,43,0.10)", padding: "3px 12px", borderRadius: 999 }}>Return</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No returns recorded today.</div>
              )}
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
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginBottom: 6 }}>Only <strong>{inventoryList.length} sarees</strong> remaining in shop stock.</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 18 }}>Stock is running low. Notify admin to arrange restocking from factory.</div>
              {invLowStockSent ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.25)", borderRadius: 12, padding: "12px 16px" }}>
                  <Check size={18} color={C.green} />
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.green }}>Admin & Superadmin have been notified</span>
                </div>
              ) : (
                <Button onClick={() => setShowInvLowStockDialog(true)} fullWidth className="h-12 bg-[#6B1A2A] border-none rounded-full font-bold text-sm text-white gap-2">
                  <Send size={16} /> Report Low Stock to Admin
                </Button>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: C.dark, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(61,14,26,0.20)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 4 }}>QUICK ACTIONS</div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,255,255,0.70)" }}>Navigate to key operations</div>
              </div>
              {[
                { label: "New Retail Sale", sub: "Record a sale at counter", tab: "sale" as TabId, icon: <ShoppingBag size={18} color={C.gold} /> },
                { label: "Shop Inventory", sub: "View all sarees in stock", tab: "inventory" as TabId, icon: <Package size={18} color={C.gold} /> },
                { label: "Customer Profiles", sub: "Browse customer records", tab: "customers" as TabId, icon: <Users size={18} color={C.gold} /> },
                { label: "Sales Reports", sub: "Analytics and trends", tab: "reports" as TabId, icon: <BarChart2 size={18} color={C.gold} /> },
              ].map((a, i) => (
                <Button
                  key={a.tab}
                  onClick={() => setActive(a.tab)}
                  variant="ghost"
                  className={
                    "flex items-center gap-3.5 w-full h-auto px-6 py-[17px] border-none rounded-none bg-transparent justify-start text-left hover:bg-white/5 " +
                    (i < 3 ? "border-b border-white/[0.07]" : "")
                  }
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(196,146,58,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", marginBottom: 2 }}>{a.label}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{a.sub}</div>
                  </div>
                  <ArrowRight size={15} color="rgba(255,255,255,0.30)" />
                </Button>
              ))}
              <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <Button onClick={() => setShowReturn(true)} variant="ghost" className="flex items-center gap-3.5 w-full h-auto border-none bg-transparent justify-start text-left p-0 hover:opacity-70 hover:bg-transparent">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(192,57,43,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <RotateCcw size={18} color={C.crim} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", marginBottom: 2 }}>Process Return</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Handle customer returns</div>
                  </div>
                  <ArrowRight size={15} color="rgba(255,255,255,0.30)" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
