import React from "react";
import { C, F, BG_IMAGE, DesktopHeroProps } from "../theme";

export function DesktopHero({ breadcrumb, titleMain, titleSub, description, pills, alertBadge, stats, bgUrl, bp = "desktop" }: DesktopHeroProps) {
  const isTablet = bp === "tablet";
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "#0D0207" }}>
      {/* Background image */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${bgUrl || BG_IMAGE})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.22,
      }} />
      {/* Dark gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(13,2,7,0.95) 0%, rgba(13,2,7,0.78) 60%, rgba(13,2,7,0.52) 100%)" }} />

      <div style={{ position: "relative", zIndex: 1, padding: isTablet ? "28px 24px 0" : "48px 48px 0" }}>
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
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
            {pills.map((p) => (
              <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 16px" }}>
                <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      {stats && stats.length > 0 && (
        <div style={{
          position: "relative", zIndex: 1, display: "grid",
          gridTemplateColumns: isTablet ? "repeat(2,1fr)" : `repeat(${stats.length},1fr)`,
          margin: isTablet ? "0 28px" : "0 48px", borderRadius: 0, borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              padding: isTablet ? "18px 20px" : "24px 28px",
              borderRight: isTablet ? (i % 2 === 0 ? "1px solid rgba(255,255,255,0.10)" : "none") : (i < stats.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none"),
              borderBottom: isTablet && i < stats.length - 2 ? "1px solid rgba(255,255,255,0.10)" : "none",
              backgroundImage: s.highlight ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              borderTop: s.highlight ? `2px solid ${C.gold}` : "none",
            }}>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, letterSpacing: "2px", color: s.highlight ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: isTablet ? 38 : 48, color: s.highlight ? "#E7C983" : "#FFFFFF", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{s.val}</div>
              <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 12, color: s.highlight ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, height: 32 }} />
    </div>
  );
}
