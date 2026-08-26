import React from "react";
import { RotateCcw, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../../shared/api/sales";
import { C, F, ShopDesktopHero, SILK_BG, PortalStatsStrip, type PortalStat } from "../theme";
import { ProcessReturn } from "../ProcessReturn";
import { Money } from "../../../../../shared/ui/domain/Money";
import { rupees, formatMoney } from "@/lib/domain/money";

export function ReturnSection({
  bp, isTablet, canSeePrices, setShowReturn,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setShowReturn: (v: boolean) => void;
}) {
  const { data: returnsRes } = useQuery({
    queryKey: ["returns-list-returnsection-desktop"],
    queryFn: () => salesApi.listReturns(100),
  });

  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-returnsection-desktop"],
    queryFn: () => salesApi.list(200),
  });

  const returnsList = returnsRes?.items ?? [];
  const allSales = salesRes?.items ?? [];
  const todayStr = new Date().toDateString();
  const todayReturns = returnsList.filter(r => new Date(r.returnDate).toDateString() === todayStr);
  const latestReturn = todayReturns[0] || returnsList[0];

  const returnedSareeIds = new Set(returnsList.map(r => r.sareeId));
  const eligibleSales = allSales.filter(s => s.channel === "RETAIL" && !returnedSareeIds.has(s.sareeId));
  const monthRefundSum = returnsList.reduce((sum, r) => sum + Number(r.refundAmount ?? 0), 0);

  const portalStats: PortalStat[] = [
    { label: "Returns today", value: todayReturns.length, sub: "Processed today", icon: RotateCcw, highlight: true },
    { label: "This month returns", value: returnsList.length, sub: "Recorded returns", icon: RotateCcw },
    { label: "Eligible sarees", value: eligibleSales.length, sub: "Available for return", icon: ShoppingBag },
    ...(canSeePrices ? [{ label: "Total refund value", value: formatMoney(rupees(monthRefundSum)), sub: "Month refunds", icon: RotateCcw }] : []),
  ];

  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · PROCESS RETURN"
        titleMain="Process Return"
        titleSub="& Handle Customer Returns"
        description="Find the original sale by scanning the barcode, select the return reason, and confirm. Inventory is updated automatically."
        pills={[
          { text: "3-Step Process" },
          { text: "Auto Inventory Update" },
          { text: `${todayReturns.length} Return${todayReturns.length === 1 ? "" : "s"} Today Already` },
        ]}
        alertBadge="Handle with care"
        bgUrl={SILK_BG}
      />
      <PortalStatsStrip stats={portalStats} overlap={true} />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        <div className="grid-cols-1 md:grid-cols-[1fr_340px]" style={{ display: "grid", gap: 36, alignItems: "start" }}>
          <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 28px rgba(44,24,16,0.10)" }}>
            <ProcessReturn onBack={() => setShowReturn(false)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 20, position: "sticky" as const, top: 84 }}>
            <div style={{ background: C.dark, borderRadius: 18, padding: "24px", boxShadow: "0 4px 24px rgba(61,14,26,0.18)" }}>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 16 }}>RETURN PROCESS</div>
              {[
                { n: "1", title: "Find Original Sale", desc: "Scan the saree barcode or enter the Saree ID to find the original sale record" },
                { n: "2", title: "Select Reason", desc: "Choose why the customer is returning — defective, wrong design, changed mind, etc." },
                { n: "3", title: "Confirm Return", desc: "Review and confirm. Inventory +1, customer profile updated, admin notified" },
              ].map((s, i) => (
                <div key={s.n} style={{ display: "flex", gap: 14, marginBottom: i < 2 ? 20 : 0, paddingBottom: i < 2 ? 20 : 0, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.crim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: "#FFF" }}>{s.n}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", marginBottom: 5 }}>{s.title}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 16, padding: "20px 22px" }}>
              <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.crim, marginBottom: 10 }}>Today's Returns</div>
              {latestReturn ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <RotateCcw size={20} color={C.crim} />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg, marginBottom: 3 }}>{latestReturn.sareeId}</div>
                      <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>
                        Return Record{canSeePrices && latestReturn.refundAmount ? <> · <Money value={rupees(Number(latestReturn.refundAmount))} /></> : ""}
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
                        {latestReturn.reason} · {new Date(latestReturn.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 6, borderTop: `1px solid rgba(192,57,43,0.15)`, paddingTop: 12 }}>
                    Return Reference: {latestReturn.returnRef}
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, padding: "12px 0" }}>
                  No returns recorded today yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
