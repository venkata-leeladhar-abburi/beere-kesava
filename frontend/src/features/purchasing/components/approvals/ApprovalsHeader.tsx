import React from "react";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { T, F } from "./tokens";

// ─── 1. PAGE HEADER ─────────────────────────────────────────────────────────
export function ApprovalsHeader({
  poCount,
  externalCount,
}: {
  poCount: number;
  externalCount: number;
}) {
  return (
    <div style={{
      background: T.darkBurgundy,
      padding: "40px 56px 80px",
      position: "relative",
      overflow: "hidden",
      minHeight: 160,
    }}>
      {/* Decorative rings */}
      <div style={{
        position: "absolute", right: -60, bottom: -80,
        width: 320, height: 320,
        borderRadius: "50%",
        border: "2px solid rgba(200,155,71,0.18)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", right: -20, bottom: -40,
        width: 220, height: 220,
        borderRadius: "50%",
        border: "1.5px solid rgba(200,155,71,0.12)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
        {/* Left copy */}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 2, marginBottom: 10 }}>
            SINCE 1999 · SUPERADMIN · APPROVALS
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 42, color: "#FFF", lineHeight: 1.1, marginBottom: 4 }}>
            Approvals
          </div>
          <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 28, color: T.antiqueGold, marginBottom: 12 }}>
            &amp; Pending Actions
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 520, lineHeight: 1.6 }}>
            Review and action purchase orders, external purchase requests, warp material requests, and rate change proposals from your admin team.
          </div>
        </div>

        {/* Right stat chips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          <div style={{
            background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
            padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
            color: "#FFF", display: "flex", alignItems: "center", gap: 8,
          }}>
            <ShoppingCart size={14} color={T.antiqueGold} />
            {poCount} Purchase Order{poCount !== 1 ? "s" : ""} Pending
          </div>
          <div style={{
            background: "rgba(200,155,71,0.18)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(200,155,71,0.30)", borderRadius: 12,
            padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
            color: "#FFF", display: "flex", alignItems: "center", gap: 8,
          }}>
            <Package size={14} color={T.goldLight} />
            {externalCount} External Purchase{externalCount !== 1 ? "s" : ""} Pending
          </div>
          <div style={{
            background: "rgba(192,57,43,0.15)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(192,57,43,0.25)", borderRadius: 12,
            padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
            color: "#FFF", display: "flex", alignItems: "center", gap: 8,
          }}>
            <Package size={14} color={T.goldLight} />
            3 Warp Requests Pending
          </div>
          <div style={{
            background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12,
            padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
            color: "#FFF", display: "flex", alignItems: "center", gap: 8,
          }}>
            <TrendingUp size={14} color={T.antiqueGold} />
            2 Rate Change Requests Pending
          </div>
        </div>
      </div>
    </div>
  );
}
