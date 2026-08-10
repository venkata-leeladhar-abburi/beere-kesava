import React from "react";
import { T, F } from "./tokens";
import { formatMoney, rupees } from "@/lib/domain/money";

// ─── 2. STATS STRIP ─────────────────────────────────────────────────────────
export function StatsStrip({
  totalPending,
  poCount,
  externalCount,
  externalTotal,
  warpCount,
  rateCount,
}: {
  totalPending: number;
  poCount: number;
  externalCount: number;
  externalTotal: number;
  warpCount: number;
  rateCount: number;
}) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
      borderRadius: 24,
      margin: "-40px 56px 0",
      padding: "0 48px",
      zIndex: 20,
      position: "relative",
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
      boxShadow: "0 8px 32px rgba(44,9,19,0.32)",
    }}>
      {/* Col 1 */}
      <div style={{ padding: "28px 0", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 8 }}>
          TOTAL PENDING
        </div>
        <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: "#FFF", lineHeight: 1 }}>
          {totalPending}
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 6 }}>
          Require your action today
        </div>
      </div>

      {/* Col 2 */}
      <div style={{ padding: "28px 0 28px 32px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 8 }}>
          PURCHASE ORDERS
        </div>
        <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: "#FFF", lineHeight: 1 }}>{poCount}</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 6 }}>
          From admin · Awaiting approval
        </div>
      </div>

      {/* Col — external purchase requests */}
      <div style={{ padding: "28px 0 28px 32px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 8 }}>
          EXTERNAL PURCHASES
        </div>
        <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: "#FFF", lineHeight: 1 }}>{externalCount}</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 6 }}>
          {formatMoney(rupees(externalTotal))} to approve
        </div>
      </div>

      {/* Col 3 — GOLD highlight */}
      <div style={{
        padding: "28px 0 28px 32px",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(200,155,71,0.12)",
        borderTop: "3px solid " + T.antiqueGold,
        position: "relative",
      }}>
        <div style={{ fontFamily: F.mono, fontSize: 12, color: T.goldLight, letterSpacing: 2, marginBottom: 8 }}>
          WARP REQUESTS
        </div>
        <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>{warpCount}</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(231,201,131,0.70)", marginTop: 6 }}>
          Pending review
        </div>
      </div>

      {/* Col 4 */}
      <div style={{ padding: "28px 0 28px 32px" }}>
        <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 8 }}>
          RATE CHANGES
        </div>
        <div style={{ fontFamily: F.display, fontSize: 38, fontWeight: 700, color: T.crimson, lineHeight: 1 }}>{rateCount}</div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 6 }}>
          ⚠ From admin · Pending
        </div>
      </div>
    </div>
  );
}
