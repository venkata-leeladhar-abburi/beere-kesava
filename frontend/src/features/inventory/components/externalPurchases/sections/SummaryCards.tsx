import React from "react";
import { Purchase } from "../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../theme";

/** Floating stat strip — total purchases, sarees tagged, pending payments, this month. */
export function SummaryCards({ purchases, totalSarees }: { purchases: Purchase[]; totalSarees: number }) {
  return (
    <div
      style={{
        padding: "0 56px",
        marginTop: -40,
        zIndex: 20,
        position: "relative",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
          borderRadius: 24,
          minHeight: 120,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {[
          {
            label: "TOTAL PURCHASES",
            value: String(purchases.length),
            sub: "All time across all entries",
            highlight: false,
            valueColor: "white",
          },
          {
            label: "TOTAL SAREES TAGGED",
            value: String(totalSarees),
            sub: "Barcodes generated",
            highlight: false,
            valueColor: T.antiqueGold,
          },
          {
            label: "PENDING PAYMENTS",
            value: String(purchases.filter((p) => p.status !== "Paid").length),
            sub: "Entries awaiting payment",
            highlight: true,
            valueColor: T.antiqueGold,
          },
          {
            label: "THIS MONTH",
            value: String(purchases.length),
            sub: "New entries this month",
            highlight: false,
            valueColor: "white",
          },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "28px 28px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
              background: card.highlight ? "rgba(200,155,71,0.10)" : "transparent",
              borderRadius: i === 0 ? "24px 0 0 24px" : i === 3 ? "0 24px 24px 0" : undefined,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 9,
                color: card.highlight ? T.antiqueGold : "rgba(255,255,255,0.45)",
                letterSpacing: 2,
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 28,
                color: card.valueColor,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {card.value}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.40)" }}>{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
