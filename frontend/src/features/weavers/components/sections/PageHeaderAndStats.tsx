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
      <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto xl:basis-[65%] xl:max-w-[65%]" style={{ position: "relative", zIndex: 2, padding: "48px 0 90px 0" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>SINCE 1999 · WEAVER MANAGEMENT</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 56, fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Weavers</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Production Overview</span>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 18, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 600, lineHeight: 1.6 }}>
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

export function StatsStrip({ stats }: { stats: WeaverStatTile[] }) {
  const ICONS = [
    <Users size={22} color={T.warmCream} />,
    <Layers size={22} color={T.warmCream} />,
    <CheckCircle2 size={22} color={T.warmCream} />,
    <AlertCircle size={22} color={T.warmCream} />,
    <IndianRupee size={22} color={T.warmCream} />,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="px-4 md:px-7 xl:px-12"
      style={{ marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div className="grid grid-cols-2 xl:flex" style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {stats.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20, backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
            whileHover={{ backgroundColor: m.gold ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.gold ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < stats.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.gold ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.gold ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {ICONS[i]}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.gold ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 48, letterSpacing: "-0.01em", color: m.crimson ? "#F47B72" : m.gold ? T.goldLight : T.warmIvory, lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
                {m.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.gold ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                  {m.sub}
                </span>
              </div>
            </div>
            {m.gold && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
