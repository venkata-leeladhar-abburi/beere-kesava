import React from "react";
import { F, T } from "./tokens";
import { StatCol } from "./shared";

export function PageHeaderStats() {
  return (
    <>
      {/* ── 1. PAGE HEADER ── */}
      <div style={{
        background: T.darkBurgundy,
        position: "relative",
        overflow: "hidden",
        minHeight: 180,
        display: "flex",
        alignItems: "stretch",
      }}>
        {/* Left col */}
        <div style={{ flex: 1, padding: "44px 56px 90px", zIndex: 10, position: "relative" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{
              fontFamily: F.mono,
              fontSize: 9,
              color: `${T.antiqueGold}80`,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}>
              SINCE 1999 · SUPERADMIN · AUDIT LOG
            </span>
          </div>
          {/* H1 */}
          <h1 style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 48,
            color: "#fff",
            margin: "0 0 4px",
            lineHeight: 1.1,
          }}>
            Audit Log
          </h1>
          {/* Italic sub */}
          <div style={{
            fontFamily: F.display,
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: 30,
            color: T.antiqueGold,
            marginBottom: 14,
            lineHeight: 1.2,
          }}>
            &amp; System Activity
          </div>
          {/* Description */}
          <p style={{
            fontFamily: F.ui,
            fontSize: 14,
            color: "rgba(255,255,255,0.60)",
            maxWidth: 520,
            margin: 0,
            lineHeight: 1.65,
          }}>
            A complete, immutable record of every action performed across the Beere Kesava &amp; Brothers Silks ERP system — materials, production, sales, approvals, and user sessions.
          </p>
        </div>

        {/* Right col — glass chips */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginRight: 56,
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 10,
          position: "relative",
        }}>
          {/* Chip 1 */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            2,840 Total Log Entries
          </div>
          {/* Chip 2 — live */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
              Live — Updates in Real Time
            </div>
          </div>
          {/* Chip 3 */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            All Time · From System Start
          </div>
        </div>

        {/* Decorative rings */}
        <div style={{
          position: "absolute",
          right: -120,
          bottom: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.12)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          right: -60,
          bottom: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.09)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.07)",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── 2. STATS STRIP ── */}
      <div style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}>
        <div style={{
          background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
          borderRadius: 24,
          minHeight: 130,
          display: "flex",
          alignItems: "stretch",
          boxShadow: "0 8px 40px rgba(44,9,19,0.40), 0 2px 8px rgba(44,9,19,0.20)",
          overflow: "hidden",
        }}>
          {/* Col 1 */}
          <StatCol
            icon="📋"
            label="TOTAL ACTIONS LOGGED"
            value="2,840"
            sub="From day one of the system"
            divider
          />
          {/* Col 2 */}
          <StatCol
            icon="⚡"
            label="ACTIONS TODAY"
            value="48"
            sub="↑ Live · Updates in real time"
            divider
          />
          {/* Col 3 — gold highlight */}
          <StatCol
            icon="👤"
            label="MOST ACTIVE USER TODAY"
            value="Admin (BK)"
            valueFontSize={22}
            valueColor={T.antiqueGold}
            sub="18 actions · Last active 12 mins ago"
            divider
            highlight
          />
          {/* Col 4 */}
          <StatCol
            icon="🔑"
            label="LOGIN SESSIONS TODAY"
            value="12"
            sub="Across all 5 roles"
            divider
          />
          {/* Col 5 */}
          <StatCol
            icon="🕐"
            label="LAST ACTION RECORDED"
            value="2 mins ago"
            valueFontSize={20}
            sub="Worker Staff · Material issued"
          />
        </div>
      </div>
    </>
  );
}
