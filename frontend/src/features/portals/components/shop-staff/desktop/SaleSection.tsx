import React from "react";
import { C, F, ShopDesktopHero, SILK_BG } from "../theme";
import { NewSaleFlow } from "../NewSaleFlow";

export function SaleSection({ bp, isTablet }: { bp: "tablet" | "desktop"; isTablet: boolean }) {
  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · NEW SALE"
        titleMain="New Retail Sale"
        titleSub="& Record at Counter"
        description="Scan the saree barcode, record the payment method, enter customer details, and generate a bill — all in one flow."
        pills={[{ text: "4-Step Process" }, { text: "Auto Bill Generation" }, { text: "Customer Auto-Fill" }]}
        bgUrl={SILK_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 360px", gap: isTablet ? 24 : 36, alignItems: "start" }}>
          <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 28px rgba(44,24,16,0.10)" }}>
            <NewSaleFlow />
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 20, position: "sticky" as const, top: 84 }}>
            <div style={{ background: C.dark, borderRadius: 18, padding: "24px", boxShadow: "0 4px 24px rgba(61,14,26,0.18)" }}>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: 1.4, textTransform: "uppercase" as const, marginBottom: 16 }}>HOW IT WORKS</div>
              {[
                { n: "1", title: "Scan Saree", desc: "Scan the barcode tag on the saree to auto-fill all details" },
                { n: "2", title: "Payment Method", desc: "Select Cash, UPI, Card, or Other" },
                { n: "3", title: "Customer Details", desc: "Search by phone — auto-fills for returning customers" },
                { n: "4", title: "Confirm & Bill", desc: "Review summary and generate the bill" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 3 ? 18 : 0, paddingBottom: i < 3 ? 18 : 0, borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.dark }}>{s.n}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: "#FFF", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.50)" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#FFF8E8", border: `1px solid rgba(200,155,71,0.28)`, borderRadius: 16, padding: "20px 22px" }}>
              <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 10 }}>After Sale</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>A bill is generated automatically. Print it or send via WhatsApp to the customer. The sale is recorded and inventory updated.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
