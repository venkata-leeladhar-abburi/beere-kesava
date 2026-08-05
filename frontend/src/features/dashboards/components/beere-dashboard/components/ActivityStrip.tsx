import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { T, F, G, EASE } from '../theme';
import { ACT } from '../data.tsx';

export function ActivityStrip({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <section style={{ padding: "0 48px 60px", background: T.silkCream }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.75, ease: EASE }}
        style={{ background: G.card, borderRadius: 28, padding: "34px 32px 38px", boxShadow: "0 20px 60px rgba(74,6,27,0.18)", border: "1px solid rgba(200,155,71,0.10)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: G.gold }} />
              <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 24, color: T.warmCream, letterSpacing: "-0.2px" }}>Recent Activity</span>
            </div>
            <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.75)", paddingLeft: 13, letterSpacing: "0.1px" }}>Live operational feed</span>
          </div>
          <motion.button
            onClick={() => onNavigate("Notifications")}
            whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.14)" }}
            whileTap={{ scale: 0.97 }}
            style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.antiqueGold, cursor: "pointer", padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(200,155,71,0.28)", backgroundColor: "rgba(200,155,71,0.07)", letterSpacing: "0.2px" }}
          >
            View All Activity →
          </motion.button>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {ACT.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 36, scale: 0.88, filter: "blur(7px)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", backgroundColor: "rgba(255,255,255,0.04)" }}
              animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", backgroundColor: "rgba(255,255,255,0.04)" } : undefined}
              whileHover={{ y: -7, scale: 1.025, boxShadow: `0px 22px 56px ${a.glow}`, backgroundColor: "rgba(255,255,255,0.08)" }}
              transition={{
                type: "spring", stiffness: 260, damping: 22,
                delay: 0.1 + i * 0.1,
                opacity: { duration: 0.4 }, filter: { duration: 0.5 },
              }}
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.04)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", border: "1px solid rgba(245,232,208,0.09)", borderRadius: 20, padding: "22px 20px 20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 175, position: "relative", overflow: "hidden", cursor: "pointer" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: a.bg, opacity: 0.70 }} />
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.25 }}
                style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: a.bg, boxShadow: `0 4px 18px ${a.glow}`, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {a.icon}
              </motion.div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: "rgba(245,232,208,0.97)", lineHeight: 1.65, flex: 1, letterSpacing: "0.05px" }}>{a.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.bg, boxShadow: `0 0 8px ${a.glow}` }} />
                <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(245,232,208,0.70)", letterSpacing: "0.3px" }}>{a.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
