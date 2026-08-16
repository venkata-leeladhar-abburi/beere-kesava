// ── Page header + stats strip ──────────────────────────────────────────────
import { motion } from "motion/react";
import { Users, Layers, CheckCircle2, AlertCircle, IndianRupee } from "lucide-react";
import { T, F } from "../theme";
import { imgPadmaVeni } from "../../../../shared/constants/weaverImages";

export interface WeaverStatTile {
  label: string;
  value: string;
  sub: string;
  gold?: boolean;
  crimson?: boolean;
}

export function PageHeader() {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
      <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto xl:basis-[65%] xl:max-w-[65%]" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 90 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>SINCE 1999 · WEAVER MANAGEMENT</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Weavers</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Production Overview</span>
        </div>
        <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: "0 0 20px", lineHeight: 1.6 }}>
          See all weavers, their current work, how they are performing, and manage their details. You can also approve material requests from here.
        </p>
      </div>
      <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
        <img src={imgPadmaVeni} alt="Padma Veni — Master Weaver" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}

import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";

export function StatsStrip({ stats }: { stats: WeaverStatTile[] }) {
  const ICONS = [
    <Users key="users" size={22} color={T.warmCream} />,
    <Layers key="layers" size={22} color={T.warmCream} />,
    <CheckCircle2 key="check-circle" size={22} color={T.warmCream} />,
    <AlertCircle key="alert-circle" size={22} color={T.warmCream} />,
    <IndianRupee key="indian-rupee" size={22} color={T.warmCream} />,
  ];

  const statItems = stats.map((m, i) => ({
    label: m.label,
    value: m.value,
    sub: m.sub,
    icon: ICONS[i],
    highlight: m.gold,
    crimson: m.crimson,
    goldVal: m.gold,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]"
      style={{ position: "relative", zIndex: 20 }}
    >
      <LuxuryStatsCard stats={statItems} />
    </motion.div>
  );
}
