import React from "react";
import { motion } from "motion/react";
import { Rows, Clock as PhClock } from "@phosphor-icons/react";
import {
  Shield, Settings, ClipboardList, ChevronRight,
  Edit3, Layers3, Eye, Activity, MapPin, Phone, AlertTriangle,
  CheckCircle2, Building2,
} from "lucide-react";
import { imgHero } from "../../../../shared/constants/imageData";
import { T, F, G, NUM, EASE } from "./theme";
import { SA_METRICS, WEAVERS, WEAVER_RATES, MATS } from "./data";
import { SectionHeader, AnimatedNumber } from "./atoms";

// ═══════════════════════════════════════════════════════════════════════════════
// SA HERO
// ═══════════════════════════════════════════════════════════════════════════════
function SAHero() {
  return (
    <section style={{ position: "relative", height: "calc(100vh - 90px - 160px)", minHeight: 380, overflow: "hidden", background: "#0D0207" }}>
      <motion.img src={imgHero} alt="Beere Kesava Showroom"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 10, ease: "linear", opacity: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 32%, rgba(13,2,7,0.97) 40%, rgba(13,2,7,0.88) 48%, rgba(13,2,7,0.55) 58%, rgba(13,2,7,0.18) 72%, rgba(13,2,7,0) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top, rgba(13,2,7,0.7) 0%, rgba(13,2,7,0) 100%)", pointerEvents: "none", zIndex: 2 }} />

      {/* SA Badge top-right */}
      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.6, ease: EASE }}
        style={{ position: "absolute", top: 28, right: 28, zIndex: 10, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "rgba(196,146,58,0.18)", border: "1px solid rgba(196,146,58,0.42)", backdropFilter: "blur(12px)" }}
      >
        <Shield size={13} color="#C4923A" />
        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11.5, color: "#E8A84A", letterSpacing: "1.5px", textTransform: "uppercase" }}>Superadmin Access</span>
      </motion.div>

      <div style={{ position: "relative", zIndex: 5, width: "50%", height: "100%", padding: "0 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 24, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
            Since 1999 · Superadmin Overview
          </span>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Superadmin", italic: false, color: T.warmCream, delay: 0.5 },
            { text: "Dashboard", italic: true, color: T.antiqueGold, delay: 0.68 },
            { text: "& Command Center", italic: false, color: T.warmCream, delay: 0.86 },
          ].map(({ text, italic, color, delay }) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.12" }}>
              <motion.div initial={{ y: "110%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: F.display, fontWeight: 400, fontStyle: italic ? "italic" : "normal", fontSize: "clamp(32px, 3.4vw, 54px)", letterSpacing: "-0.5px", color }}
              >{text}</motion.div>
            </div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.0 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.90)", lineHeight: 1.85, margin: 0, maxWidth: 360, letterSpacing: "0.05px" }}
        >
          Full visibility and control over all operations — rates, approvals, audit logs, and more.
        </motion.p>
      </div>

      {/* Decorative rings */}
      {[180, 280, 380].map((sz, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8 + i * 0.18, ease: EASE }}
          style={{ position: "absolute", right: "25%", top: "50%", transform: "translate(50%, -50%)", width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(196,146,58,${0.07 - i * 0.015})`, pointerEvents: "none", zIndex: 3 }}
        />
      ))}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA METRICS BAR
// ═══════════════════════════════════════════════════════════════════════════════
function SAMetricsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G.card, borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {SA_METRICS.map((m: any, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : m.crimsonHi ? "rgba(192,57,43,0.12)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 18px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : m.crimsonHi ? "linear-gradient(135deg, rgba(192,57,43,0.16) 0%, rgba(192,57,43,0.05) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < SA_METRICS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "pointer",
            }}
          >
            <motion.div whileHover={{ scale: 1.08, rotate: 3 }} transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : m.crimsonHi ? "rgba(192,57,43,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : m.crimsonHi ? "rgba(192,57,43,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >{m.ico}</motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : m.crimsonHi ? "rgba(232,120,110,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.hi ? T.goldLight : m.crimsonHi ? "#F08080" : T.warmCream, lineHeight: 1.0, marginBottom: 8, ...NUM }}>
                <AnimatedNumber raw={m.val} />
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : m.crimsonHi ? "rgba(240,128,128,0.90)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                {m.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA OVERVIEW — ALERT STRIP
// ═══════════════════════════════════════════════════════════════════════════════
function SAAlertStrip() {
  return (
    <div style={{ margin: "36px 48px 0", padding: "14px 22px", borderRadius: 14, background: "rgba(196,146,58,0.10)", border: "none", borderLeft: "3px solid #C4923A", display: "flex", alignItems: "center", gap: 12 }}>
      <Shield size={16} color="#C4923A" />
      <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.luxuryBrown, letterSpacing: "0.1px" }}>
        You are in <strong style={{ color: "#C4923A" }}>Superadmin mode</strong>. All data is visible and editable. Actions here affect the entire system.
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function SAQuickActions({ setNav }: { setNav: (v: string) => void }) {
  const actions = [
    { icon: <Settings size={22} color={T.antiqueGold} />, label: "Edit Rates & Pricing", sub: "Update making charge rates", nav: "Rates", color: T.antiqueGold, bg: "rgba(200,155,71,0.08)", border: "rgba(200,155,71,0.22)" },
    { icon: <CheckCircle2 size={22} color={T.royalBurgundy} />, label: "Review Approvals", sub: "3 pending require action", nav: "Approvals", color: T.royalBurgundy, bg: "rgba(110,15,45,0.06)", border: T.borderDef, badge: "3" },
    { icon: <ClipboardList size={22} color={T.luxuryBrown} />, label: "View Audit Log", sub: "Full system activity trail", nav: "AuditLog", color: T.luxuryBrown, bg: "rgba(59,35,20,0.06)", border: "rgba(59,35,20,0.12)" },
    { icon: <Building2 size={22} color={T.green} />, label: "Manage Firms", sub: "Payments & vendor records", nav: "Payments", color: T.green, bg: "rgba(30,102,64,0.06)", border: "rgba(30,102,64,0.14)" },
  ];
  return (
    <section style={{ padding: "36px 48px 0" }}>
      <SectionHeader title="Quick Actions" actionText="" small />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {actions.map((a, i) => (
          <motion.button key={a.nav}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.09 }}
            whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(74,6,27,0.12)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setNav(a.nav)}
            style={{ padding: "22px 20px", borderRadius: 20, border: `1px solid ${a.border}`, background: a.bg, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}
          >
            {a.badge && (
              <div style={{ position: "absolute", top: 14, right: 14, width: 22, height: 22, borderRadius: "50%", background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 11, color: "#fff" }}>{a.badge}</span>
              </div>
            )}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.60)", border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {a.icon}
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: T.luxuryBrown, letterSpacing: "-0.1px", marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe }}>{a.sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: a.color, fontFamily: F.ui, fontWeight: 500, fontSize: 12 }}>
              Open <ChevronRight size={12} />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA OVERVIEW — WEAVERS SECTION (simplified)
// ═══════════════════════════════════════════════════════════════════════════════
function SAWeaverSection({ onNavigate }: { onNavigate: (tab: string, ctx?: any) => void }) {
  return (
    <section style={{ padding: "48px 48px 40px", background: T.silkCream }}>
      <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
      <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
        {WEAVERS.map((w, i) => (
          <motion.div
            key={w.id}
            onClick={() => onNavigate("Weavers", { weaverId: w.id, mode: "view" })}
            initial={{ opacity: 0, y: 44, scale: 0.90, filter: "blur(7px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ y: -9, scale: 1.012, boxShadow: "0px 32px 80px rgba(74,6,27,0.18)" }}
            transition={{ type: "spring", stiffness: 240, damping: 22, delay: i * 0.12, opacity: { duration: 0.45 }, filter: { duration: 0.5 } }}
            style={{ flex: 1, background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            {/* Header Banner - Full Image Height 170px */}
            <div style={{ height: 170, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
              {w.img ? (
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  src={w.img}
                  alt={w.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.bg} 0%, ${T.luxuryBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.display, fontSize: 44, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{w.initials}</span>
                </div>
              )}

              {/* Dark gradient overlay for modern look */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

              {/* Floating ID badge in top left */}
              <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                {w.id}
              </div>

              {/* Floating gentle status pill overlay at the bottom left of the image banner */}
              <div style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px"
              }}>
                {w.status === "active" ? (
                  <Activity size={13} color="#2ECC71" style={{ flexShrink: 0 }} />
                ) : w.status === "qc" ? (
                  <PhClock size={13} color="#F1C40F" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={13} color="#BDC3C7" style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  fontFamily: F.ui,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)"
                }}>
                  {w.status === "active" ? "Currently Weaving" : w.status === "qc" ? "Pending QC" : "Idle"}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
              {/* Name and Batch beside it */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 8 }}>
                <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 800, lineHeight: 1.25 }}>
                  {w.name}
                </div>
                {w.batch && (
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 8px", textTransform: "uppercase" }}>
                    {w.batch}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  <MapPin size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span>{w.village}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  <Phone size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span>{w.mobile}</span>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "4px 0 12px 0" }} />

              {/* Dual Column Stats (Looms & Rate/Charge) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {/* Looms block */}
                <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Rows size={14} color={T.royalBurgundy} weight="fill" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                  </div>
                </div>

                {/* Rate / Making Charge block */}
                <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>₹</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Making Charge</span>
                    <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>
                      {WEAVER_RATES[w.id] ? WEAVER_RATES[w.id].rate.split("/")[0] : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Design type detail strip */}
              {WEAVER_RATES[w.id] && (
                <div style={{ background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.luxuryBrown }}>{WEAVER_RATES[w.id].type}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{WEAVER_RATES[w.id].code}</span>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <Eye size={14} /> Details
                </motion.button>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "edit" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.05)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", color: T.royalBurgundy, border: `1px solid ${T.royalBurgundy}`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Edit3 size={13} /> Edit
                </motion.button>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onNavigate("Weavers", { weaverId: w.id, mode: "view" }); }}
                  whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: "10px 4px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <Layers3 size={14} /> Batches
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <motion.div
            onClick={() => onNavigate("AllWeavers")}
            whileHover={{ scale: 1.12, boxShadow: "0px 10px 30px rgba(74,6,27,0.16)" }}
            whileTap={{ scale: 0.93 }}
            style={{ width: 44, height: 44, borderRadius: "50%", background: T.warmIvory, border: `1.5px solid ${T.borderGold}`, boxShadow: "0px 6px 20px rgba(74,6,27,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronRight size={18} color={T.royalBurgundy} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA OVERVIEW — RAW MATERIAL SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function SARawMaterial() {
  return (
    <section style={{ padding: "0 48px 72px", background: T.silkCream }}>
      <SectionHeader title="Raw Material Overview" actionText="View All Materials →" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {MATS.map((m, i) => (
          <motion.div key={m.name}
            initial={{ opacity: 0, scale: 0.88, y: 36, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ y: -9, scale: 1.015, boxShadow: "0px 36px 88px rgba(74,6,27,0.17)" }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: i * 0.14, opacity: { duration: 0.45 }, filter: { duration: 0.55 } }}
            style={{ background: m.cardBg, borderRadius: 28, overflow: "hidden", border: `1px solid ${m.borderColor}`, boxShadow: "0px 10px 40px rgba(74,6,27,0.06)", cursor: "pointer" }}
          >
            <div style={{ height: 170, overflow: "hidden", position: "relative" }}>
              <motion.img src={m.img} alt={m.name} whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.accent, opacity: 0.7 }} />
            </div>
            <div style={{ padding: "22px 24px 26px" }}>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, color: T.luxuryBrown, letterSpacing: "-0.2px", lineHeight: 1.1, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, marginBottom: 20, letterSpacing: "0.1px" }}>{m.sub}</div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 38, color: m.accent, lineHeight: 1.0, marginBottom: 4, ...NUM }}>
                <AnimatedNumber raw={m.stock.replace(" kg", "")} />{m.stock.includes("kg") ? " kg" : ""}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA OVERVIEW PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function SAOverviewPage({ setNav }: { setNav: (v: string) => void }) {
  return (
    <div style={{ background: T.silkCream }}>
      <SAHero />
      <SAMetricsBar />
      <SAAlertStrip />
      <div style={{ background: T.silkCream, paddingTop: 36 }}>
        <SAQuickActions setNav={setNav} />
      </div>
      <SAWeaverSection onNavigate={setNav} />
      <SARawMaterial />
    </div>
  );
}
