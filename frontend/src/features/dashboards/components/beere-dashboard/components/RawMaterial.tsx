import React from 'react';
import { motion } from 'motion/react';
import { T, F, EASE } from '../theme';
import { MATS } from '../data.tsx';
import { SectionHeader, FadeUp } from '../ui';

export function RawMaterial({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section style={{ padding: "0 48px 72px", background: T.silkCream }}>
      <SectionHeader title="Raw Material Overview" actionText="View All Materials →" onAction={() => onNavigate("Materials")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
        {MATS.map((m, i) => (
          <FadeUp key={m.name} delay={i * 0.1} style={{ height: "100%" }}>
            <motion.div
              onClick={() => onNavigate("Materials")}
              initial={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              animate={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              whileHover={{ y: -6, boxShadow: "0px 28px 72px rgba(74,6,27,0.15)" }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ background: T.warmIvory, borderRadius: 22, border: `1px solid ${T.borderDef}`, overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <div style={{ height: 180, flexShrink: 0, overflow: "hidden" }}>
                <motion.img
                  src={m.img}
                  alt={m.name}
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: T.luxuryBrown, marginBottom: 6 }}>{m.name}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 4 }}>{m.desc}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: m.stockColor, lineHeight: 1, margin: "18px 0 8px" }}>{m.stock}</div>
              </div>
            </motion.div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
