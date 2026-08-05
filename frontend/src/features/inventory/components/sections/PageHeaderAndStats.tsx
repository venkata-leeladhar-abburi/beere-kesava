import React from "react";
import { motion } from "motion/react";
import { Package, Clock, CheckCircle2, Truck, AlertTriangle } from "lucide-react";
import { T, F } from "../theme";

const imgInventoryHero = "https://images.unsplash.com/photo-1585914924626-15adac1e6402?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

interface PageHeaderAndStatsProps {
  total: number;
  pendingCount: number;
  ready: number;
  thisMonth: number;
  damaged: number;
}

export function PageHeaderAndStats({
  total,
  pendingCount,
  ready,
  thisMonth,
  damaged,
}: PageHeaderAndStatsProps) {
  const stats = [
    { val: total,        label: "TOTAL IN INVENTORY",     sub: "All finished sarees",          hi: false, crimson: false, goldVal: false, Icon: Package },
    { val: pendingCount, label: "PENDING FINISHING",      sub: "QC passed, needs finishing",   hi: false, crimson: false, goldVal: false, Icon: Clock },
    { val: ready,        label: "READY FOR DISPATCH",     sub: "Cleared, awaiting dispatch",   hi: true,  crimson: false, goldVal: true,  Icon: CheckCircle2 },
    { val: thisMonth,    label: "DISPATCHED THIS MONTH",  sub: "To shop + wholesale",          hi: false, crimson: false, goldVal: false, Icon: Truck },
    { val: damaged,      label: "DAMAGED — NEEDS REVIEW", sub: "Reported during verification", hi: false, crimson: true,  goldVal: false, Icon: AlertTriangle },
  ];

  return (
    <>
      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <header style={{ background: "#3D0E1A", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · INVENTORY MANAGEMENT</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 48, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Finished Goods</h1>
            <span style={{ fontFamily: F.display, fontSize: 30, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Dispatch</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
            Track all finished sarees received from quality check and dispatch them to shop or wholesale customers.
          </p>
        </div>
        {/* Right image with gradient */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #3D0E1A 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
          <img src={imgInventoryHero} alt="Silk saree inventory" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
      >
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {stats.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
              whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 48, color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                  {m.sub}
                </div>
              </div>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
