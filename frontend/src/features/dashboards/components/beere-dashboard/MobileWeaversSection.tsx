import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { MapPin, Phone, Eye, Edit3, Layers3, Activity, AlertTriangle } from 'lucide-react';
import { Rows, Clock as PhClock } from "@phosphor-icons/react";
import { T, F, G, EASE } from './theme';
import { WEAVERS, MATS } from './data';
import { AnimatedBar } from './ui';

export function MobileWeavers({ onNavigate }: { onNavigate: (tab: string, ctx?: any) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div ref={ref} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Active Weavers</span>
        </div>
        <button onClick={() => onNavigate("AllWeavers")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {WEAVERS.map((w, i) => (
          <motion.div
            key={w.id}
            onClick={() => onNavigate("Weavers", { weaverId: w.id, mode: "view" })}
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            whileHover={{ y: -4, boxShadow: "0px 14px 40px rgba(74,6,27,0.12)" }}
            transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
            style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
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

              {/* Floating status pill */}
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
            <div style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
              {/* Name and Batch */}
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

              {/* Looms stat */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Rows size={14} color={T.royalBurgundy} weight="fill" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 9.5, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
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
      </div>
    </div>
  );
}

export function MobileRawMaterial({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div ref={ref} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Raw Material Overview</span>
        </div>
        <button onClick={() => onNavigate("Materials")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {MATS.map((m, i) => (
          <motion.div
            key={m.name}
            onClick={() => onNavigate("Materials")}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={inView ? { opacity: 1, scale: 1, y: 0 } : undefined}
            whileHover={{ y: -4, boxShadow: "0px 14px 40px rgba(74,6,27,0.10)" }}
            transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
            style={{ background: T.warmIvory, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.borderDef}`, boxShadow: "0px 6px 24px rgba(74,6,27,0.06)", cursor: "pointer" }}
          >
            <div style={{ height: 150, overflow: "hidden" }}>
              <motion.img
                src={m.img}
                alt={m.name}
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.45 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.taupe, lineHeight: 1.5, marginBottom: 4 }}>{m.desc}</div>
              {m.extra && <div style={{ marginBottom: 4 }}>{m.extra}</div>}
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, color: m.stockColor, lineHeight: 1, margin: "12px 0 6px" }}>{m.stock}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: m.green ? T.taupe : T.crimson, lineHeight: 1.5, marginBottom: 12 }}>{m.note}</div>
              <AnimatedBar pct={m.pct} color={m.barColor} height={5} />
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, margin: "8px 0 12px" }}>{m.pct}% of storage capacity</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: m.green ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", border: `1px solid ${m.green ? "rgba(30,102,64,0.20)" : "rgba(192,57,43,0.20)"}`, borderRadius: 8, padding: "5px 12px" }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: m.green ? T.green : T.crimson }}>{m.badge}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
