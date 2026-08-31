import { C, F, BG_IMAGE, DesktopHeroProps } from "../theme";
import { LuxuryStatsCard, type StatItem } from "@/shared/ui/LuxuryStatsCard";
import { IcoResourceMgmt, IcoFabricRoll, IcoQualityCheck, IcoWarehouse, IcoInvoice } from "@/features/dashboards";

const ICONS = [
  <IcoResourceMgmt key="r" sz={22} col="#F5E8D0" />,
  <IcoFabricRoll key="f" sz={22} col="#F5E8D0" />,
  <IcoQualityCheck key="q" sz={22} col="#F5E8D0" />,
  <IcoWarehouse key="w" sz={22} col="#F5E8D0" />,
  <IcoInvoice key="i" sz={22} col="#F5E8D0" />,
];

export function DesktopHero({ breadcrumb, titleMain, titleSub, description, pills, alertBadge, stats, bgUrl, bp = "desktop" }: DesktopHeroProps) {
  const isTablet = bp === "tablet";
  const statItems: StatItem[] = (stats || []).map((s, i) => ({
    label: s.label,
    value: s.val,
    sub: s.sub,
    highlight: s.highlight,
    goldVal: s.highlight,
    icon: ICONS[i % ICONS.length],
  }));

  return (
    <div>
      {/* ── HERO BANNER ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#0D0207", padding: isTablet ? "28px 24px 76px" : "48px 48px 84px" }}>
        {/* Background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${bgUrl || BG_IMAGE})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.22, pointerEvents: "none"
        }} />
        {/* Dark gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(13,2,7,0.95) 0%, rgba(13,2,7,0.78) 60%, rgba(13,2,7,0.52) 100%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ fontFamily: F.m, fontSize: 13, letterSpacing: "1.8px", color: "rgba(255,253,249,0.50)", textTransform: "uppercase", marginBottom: 12 }}>{breadcrumb}</div>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: isTablet ? 40 : 56, color: "#FFFDF9", lineHeight: 1.1, marginBottom: 4 }}>
                {titleMain} <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 400, fontSize: isTablet ? 26 : 36, color: C.gold }}>{titleSub}</span>
              </div>
            </div>
            {alertBadge && (
              <div style={{ background: "rgba(200,155,71,0.25)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
                <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#E7C983" }}>{alertBadge}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ fontFamily: F.u, fontSize: 18, color: "rgba(255,253,249,0.70)", lineHeight: 1.6, maxWidth: "640px", marginBottom: 22 }}>{description}</div>

          {/* Pills */}
          {pills && pills.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {pills.map((p) => (
                <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 16px" }}>
                  <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FLOATING LUXURY STATS CARD (MATCHING MY BATCHES PAGE) ── */}
      {stats && stats.length > 0 && (
        <div style={{ padding: isTablet ? "0 24px" : "0 48px", marginTop: -56, position: "relative", zIndex: 20 }}>
          <LuxuryStatsCard stats={statItems} />
        </div>
      )}
    </div>
  );
}
