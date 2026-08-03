import React from "react";
import { C, F, BG_IMAGE, DesktopHeroProps } from "../theme";

export function DesktopHero({ breadcrumb, titleMain, titleSub, description, pills, alertBadge, stats, bgUrl, bp = "desktop" }: DesktopHeroProps) {
  const isTablet = bp === "tablet";
  return (
    <div style={{ position: "relative", overflow: "hidden", background: C.dark }}>
      {/* Background image */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${bgUrl || BG_IMAGE})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.22,
      }} />
      {/* Dark gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(61,14,26,0.95) 0%, rgba(61,14,26,0.75) 60%, rgba(61,14,26,0.50) 100%)" }} />

      <div style={{ position: "relative", zIndex: 1, padding: isTablet ? "28px 28px 0" : "40px 48px 0" }}>
        {/* Breadcrumb */}
        <div style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", marginBottom: 20 }}>{breadcrumb}</div>

        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: isTablet ? 40 : 62, color: "#FFF", lineHeight: 1, marginBottom: 4 }}>
              {titleMain} <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: isTablet ? 26 : 38, color: C.gold }}>{titleSub}</span>
            </div>
          </div>
          {alertBadge && (
            <div style={{ background: "rgba(196,146,58,0.25)", border: `1px solid ${C.gold}`, borderRadius: 999, padding: "8px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold }} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.gold }}>{alertBadge}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ fontFamily: F.u, fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: 640, marginBottom: 22 }}>{description}</div>

        {/* Pills */}
        {pills && pills.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
            {pills.map((p, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 16px" }}>
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
            <div key={i} style={{
              padding: isTablet ? "18px 20px" : "24px 28px",
              borderRight: isTablet ? (i % 2 === 0 ? "1px solid rgba(255,255,255,0.10)" : "none") : (i < stats.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none"),
              borderBottom: isTablet && i < stats.length - 2 ? "1px solid rgba(255,255,255,0.10)" : "none",
              background: s.highlight ? "rgba(196,146,58,0.18)" : "transparent",
              borderTop: s.highlight ? `2px solid ${C.gold}` : "none",
            }}>
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", marginBottom: 10 }}>{s.label}</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: isTablet ? 38 : 54, color: s.highlight ? C.gold : "#FFF", lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, height: 32 }} />
    </div>
  );
}
