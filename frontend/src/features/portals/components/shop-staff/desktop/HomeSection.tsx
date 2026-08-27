import React from "react";
import { AlertTriangle, ArrowUpRight, BarChart2, Check, ChevronRight, Package, RotateCcw, Send, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../../shared/api/sales";
import { inventoryApi } from "../../../../../shared/api/inventory";
import { customersApi } from "../../../../../shared/api/customers";
import { useAuth } from "../../../../../contexts/AuthContext";
import { C, F, PageHero, PortalStatsStrip, type PortalStat } from "../theme";
import { DSH } from "./DSH";
import { Button } from "../../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";
import { rupees, formatMoney } from "@/lib/domain/money";
import { sareeTypeText } from "../stock-format";

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";

function dateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

const PAYMENT_LABEL: Record<string, string> = { cash: "Cash", upi: "UPI", card: "Card", other: "Other" };

export function HomeSection({
  isTablet, canSeePrices, setActive, invLowStockSent, setShowInvLowStockDialog,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setActive: (tab: TabId) => void; setShowReturn: (v: boolean) => void;
  invLowStockSent: boolean; setShowInvLowStockDialog: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const { data: salesRes, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
    queryKey: ["sales-list-homesection"],
    queryFn: () => salesApi.list(100),
  });

  const { data: inventoryRes, isError: inventoryError, refetch: refetchInventory } = useQuery({
    // Shop stock, not factory stock — these tiles are labelled "Shop
    // inventory" but counted every QC-passed saree in the factory, including
    // ones that had never been dispatched here.
    queryKey: ["shop-stock"],
    queryFn: () => inventoryApi.shopStock(),
  });

  const { data: returnsRes, isError: returnsError, refetch: refetchReturns } = useQuery({
    queryKey: ["returns-list-homesection"],
    queryFn: () => salesApi.listReturns(100),
  });

  const { data: customersRes } = useQuery({
    queryKey: ["customers-homesection"],
    queryFn: () => customersApi.list(100),
  });

  const salesList = salesRes?.items ?? [];
  // Sold pieces are still delivered stock, but they are not what "in stock" means.
  const inventoryList = (inventoryRes ?? []).filter(s => s.status !== "sold");
  const returnsList = returnsRes?.items ?? [];
  const customerMap = new Map((customersRes?.items ?? []).map(c => [c.id, c.name]));

  const todayStr = new Date().toDateString();
  const todaySales = salesList.filter(s => new Date(s.saleDate).toDateString() === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.amount), 0);
  const todayReturns = returnsList.filter(r => new Date(r.returnDate).toDateString() === todayStr);

  const recentSales = salesList.slice(0, 5).map(s => ({
    id: s.sareeId,
    customer: s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Retail Counter",
    design: sareeTypeText({ sareeTypeCode: s.saree?.sareeTypeCode ?? null, sareeTypeLabel: s.saree?.sareeType?.type ?? null }),
    pay: s.paymentMethod ? (PAYMENT_LABEL[s.paymentMethod] ?? s.paymentMethod) : "—",
    amt: formatMoney(rupees(Number(s.amount))),
    time: dateLabel(s.saleDate),
    color: "#6E0F2D",
    ext: false,
  }));

  const latestReturn = returnsList[0];
  const firstName = user?.name ? user.name.split(" ")[0] : "Staff";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats: PortalStat[] = [
    { label: "Today's sales", value: salesError ? "Error" : todaySales.length, sub: salesError ? "Tap to retry" : "Recorded today", icon: ShoppingBag, highlight: true, onClick: salesError ? () => refetchSales() : undefined },
    ...(canSeePrices ? [{ label: "Today's revenue", value: salesError ? "Error" : formatMoney(rupees(todayRevenue)), sub: salesError ? "Tap to retry" : `From ${todaySales.length} sales`, icon: BarChart2, onClick: salesError ? () => refetchSales() : undefined }] : []),
    { label: "Shop inventory", value: inventoryError ? "Error" : inventoryList.length, sub: inventoryError ? "Tap to retry" : "Sarees currently in stock", icon: Package, onClick: inventoryError ? () => refetchInventory() : undefined },
    { label: "Returns today", value: returnsError ? "Error" : todayReturns.length, sub: returnsError ? "Tap to retry" : "Processed and recorded", icon: RotateCcw, alert: todayReturns.length > 0, onClick: returnsError ? () => refetchReturns() : undefined },
  ];

  return (
    <>
      <PageHero
        eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
        title={greeting + ","}
        titleAccent={firstName}
        description={`Here's what needs your attention today. You have ${todaySales.length} sale${todaySales.length === 1 ? "" : "s"} recorded today.`}
        actions={
          <Button
            variant="primary"
            iconRight={ChevronRight}
            onClick={() => setActive("sale")}
            className="rounded-[14px] bg-gradient-to-br from-[#6E0F2D] to-[#4A061B] px-6 py-[13px] text-[#FFFDF9] shadow-[0_8px_28px_rgba(110,15,45,0.45)] hover:from-[#6E0F2D] hover:to-[#4A061B]"
          >
            Start Today's Work
          </Button>
        }
      />

      {/* Date chip pinned to hero */}
      <div className="relative hidden md:block">
        <div
          style={{ position: "absolute", top: -308, right: 48, fontFamily: F.m, fontSize: 12, color: "rgba(255,253,249,0.45)", background: "rgba(255,253,249,0.08)", border: "1px solid rgba(255,253,249,0.12)", padding: "6px 14px", borderRadius: 8, zIndex: 21 }}
        >
          {today}
        </div>
      </div>

      <PortalStatsStrip stats={stats} />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 380px", gap: isTablet ? 24 : 36, alignItems: "start" }}>
          {/* Left */}
          <div>
            {/* New Sale CTA */}
            <div style={{ background: "#FFF", border: `2px solid ${C.burg}`, borderRadius: 20, padding: "28px 30px", marginBottom: 28, display: "flex", alignItems: "center", gap: 22, boxShadow: "0 4px 24px rgba(110,15,45,0.10)" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(200,155,71,0.35)" }}>
                <ShoppingBag size={34} color={C.dark} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.text, marginBottom: 6 }}>New Retail Sale</div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Record a sale at the counter — scan saree barcode, select payment, generate bill</div>
              </div>
              <Button variant="primary" onClick={() => setActive("sale")} className="h-14 px-7 rounded-full bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] border-none font-bold text-base gap-2 shrink-0 shadow-[0_4px_16px_rgba(110,15,45,0.30)]">
                <ArrowUpRight size={18} /> Start New Sale
              </Button>
            </div>

            {/* Recent Sales */}
            <DSH label="Recent Sales — Today" link="View All →" onLink={() => setActive("reports")} />
            <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, overflow: isTablet ? "auto" : "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 32 }}>
              <div role="table" aria-label="Recent Sales — Today" className={isTablet ? "min-w-[640px]" : undefined}>
                <div role="rowgroup">
                  <div role="row" style={{ display: "grid", gridTemplateColumns: `1fr 1fr 120px 80px${canSeePrices ? " 100px" : ""}`, padding: "14px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                    {["Saree ID", "Customer", "Design", "Payment", ...(canSeePrices ? ["Amount"] : [])].map(h => (
                      <div key={h} role="columnheader" style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                    ))}
                  </div>
                </div>
                {salesLoading ? (
                  <div style={{ padding: 16 }}><LoadingState variant="skeleton" rows={4} /></div>
                ) : salesError ? (
                  <ErrorState error={undefined} onRetry={() => void refetchSales()} />
                ) : recentSales.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
                    No sales recorded today yet.
                  </div>
                ) : (
                  <div role="rowgroup">
                    {recentSales.map((s, i) => (
                      <div key={s.id} role="row" style={{ display: "grid", gridTemplateColumns: `1fr 1fr 120px 80px${canSeePrices ? " 100px" : ""}`, padding: "18px 24px", borderBottom: i < recentSales.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", alignItems: "center" }}>
                        <div role="cell" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 8, height: 36, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.id}</div>
                            {s.ext && <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold, background: "rgba(200,155,71,0.12)", padding: "1px 7px", borderRadius: 999 }}>External</span>}
                          </div>
                        </div>
                        <div role="cell" style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>{s.customer}</div>
                        <div role="cell" style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.design}</div>
                        <div role="cell" style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.pay}</div>
                        {canSeePrices && <div role="cell" style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
                      </div>
                    ))}
                  </div>
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
                <Button variant="primary" onClick={() => setShowInvLowStockDialog(true)} fullWidth className="h-12 bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] border-none rounded-full font-bold text-sm gap-2">
                  <Send size={16} /> Report Low Stock to Admin
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
