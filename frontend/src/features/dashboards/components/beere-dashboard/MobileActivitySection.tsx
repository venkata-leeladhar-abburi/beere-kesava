import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { T, F, G, EASE } from './theme';
import { ACT } from './data';

export function MobileActivity({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.65, ease: EASE }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Recent Activity</span>
        </div>
        <button onClick={() => onNavigate("Notifications")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </motion.div>
      <div style={{ background: G.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 32px rgba(74,6,27,0.16)", border: "1px solid rgba(200,155,71,0.12)" }}>
        {ACT.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE }}
            style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 18px", backgroundColor: "rgba(0,0,0,0)", borderBottom: i < ACT.length - 1 ? "1px solid rgba(245,232,208,0.10)" : "none" }}
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: a.bg, boxShadow: `0 4px 14px ${a.glow}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {a.icon}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14.5, color: "rgba(245,232,208,0.97)", lineHeight: 1.6, marginBottom: 6, letterSpacing: "0.05px" }}>{a.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.bg, boxShadow: `0 0 6px ${a.glow}` }} />
                <span style={{ fontFamily: F.mono, fontSize: 11.5, color: "rgba(245,232,208,0.78)", letterSpacing: "0.3px" }}>{a.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
