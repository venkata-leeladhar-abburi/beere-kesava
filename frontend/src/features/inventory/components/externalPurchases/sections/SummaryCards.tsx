import React from "react";
import { ShoppingCart, Tag, FileText, Calendar } from "lucide-react";
import { Purchase } from "../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../theme";

/** Floating stat strip — total purchases, sarees tagged, pending payments, this month. */
export function SummaryCards({ purchases, totalSarees }: { purchases: Purchase[]; totalSarees: number }) {
  return (
    <div
      className="px-4 md:px-7 xl:px-14 -mt-6 md:-mt-8 xl:-mt-[40px]"
      style={{
        zIndex: 20,
        position: "relative",
      }}
    >
      <div
        className="grid grid-cols-2 xl:flex"
        style={{
          background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
          borderRadius: 28,
          alignItems: "stretch",
          boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
          overflow: "hidden",
          minHeight: 140,
        }}
      >
        {[
          {
            label: "TOTAL PURCHASES",
            val: String(purchases.length),
            sub: "All time across all entries",
            hi: false,
            Icon: ShoppingCart,
          },
          {
            label: "TOTAL SAREES TAGGED",
            val: String(totalSarees),
            sub: "Barcodes generated",
            hi: false,
            Icon: Tag,
          },
          {
            label: "PENDING PAYMENTS",
            val: String(purchases.filter((p) => p.status !== "Paid").length),
            sub: "Entries awaiting payment",
            hi: true,
            Icon: FileText,
          },
          {
            label: "THIS MONTH",
            val: String(purchases.length),
            sub: "New entries this month",
            hi: false,
            Icon: Calendar,
          },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
            }}
          >
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
              <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.Icon size={20} color={m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(28px, 8vw, 48px)", color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                    {m.sub}
                  </span>
                </div>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}
