import React from "react";
import { motion } from "motion/react";
import { X, ArrowRight, Check } from "lucide-react";
import { UnifiedNotif, PRIORITY, CATEGORIES } from "./notifTypes";

const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = {
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
};

interface NotificationDetailPanelProps {
  selected: UnifiedNotif;
  setSelected: (n: UnifiedNotif | null) => void;
  markRead: (id: string) => void;
}

export function NotificationDetailPanel({ selected, setSelected, markRead }: NotificationDetailPanelProps) {
  const cfg = PRIORITY[selected.priority];
  const PriorityIcon = cfg.Icon;
  const catCfg = CATEGORIES.find(c => c.key === selected.category)!;
  const CatIcon = catCfg.Icon;

  return (
    <motion.div
      key={selected.id}
      initial={{ opacity: 0, x: 32, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      style={{ flex: "0 0 380px", position: "sticky", top: 148 }}>
      <div style={{ background: T.warmIvory, borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0 16px 56px rgba(110,15,45,0.10)", overflow: "hidden" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}55)` }} />

        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: "4px 12px" }}>
            <PriorityIcon size={12} /> {cfg.label}
          </span>
          <motion.button onClick={() => setSelected(null)} whileHover={{ scale: 1.1, backgroundColor: "rgba(110,15,45,0.06)" }} whileTap={{ scale: 0.93 }}
            style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${T.borderDef}`, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={14} color={T.taupe} />
          </motion.button>
        </div>

        <div style={{ padding: "24px 24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: catCfg.color + "14", border: `1px solid ${catCfg.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CatIcon size={24} color={catCfg.color} />
            </div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: "2px", color: catCfg.color, textTransform: "uppercase", marginBottom: 4 }}>{catCfg.label}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{selected.time}</div>
            </div>
          </div>

          <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, lineHeight: 1.35, marginBottom: 16, letterSpacing: "-0.2px" }}>
            {selected.title}
          </div>

          <div style={{ background: T.silkCream, borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "18px 20px", marginBottom: 20 }}>
            <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.85, margin: 0 }}>
              {selected.body}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Priority",  value: cfg.label,     color: cfg.color },
              { label: "Category",  value: catCfg.label,  color: catCfg.color },
              { label: "Received",  value: selected.time, color: T.luxuryBrown },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: T.taupe, marginBottom: 5 }}>{label}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>

          {selected.action && (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.28)" }}
              whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: G.button, color: "#FFFDF9", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(110,15,45,0.22)", marginBottom: 10 }}>
              {selected.action} <ArrowRight size={15} />
            </motion.button>
          )}
          <motion.button onClick={() => { markRead(selected.id); setSelected(null); }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(110,15,45,0.06)" }}
            whileTap={{ scale: 0.98 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 14, border: `1px solid ${T.borderDef}`, background: "rgba(0,0,0,0)", color: T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            <Check size={14} /> Mark as read
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
