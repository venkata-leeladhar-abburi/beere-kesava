import React from "react";
import { motion } from "motion/react";
import { X, ArrowRight, Check } from "lucide-react";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { UnifiedNotif, PRIORITY, CATEGORIES } from "./notifTypes";

const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 999, padding: "4px 12px" }}>
            <PriorityIcon size={12} /> {cfg.label}
          </span>
          <IconButton icon={X} label="Close" variant="secondary" size="sm" className="rounded-full" onClick={() => setSelected(null)} />
        </div>

        <div style={{ padding: "24px 24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: catCfg.color + "14", border: `1px solid ${catCfg.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CatIcon size={24} color={catCfg.color} />
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "2px", color: catCfg.color, textTransform: "uppercase", marginBottom: 4 }}>{catCfg.label}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{selected.time}</div>
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

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 10, marginBottom: 22 }}>
            {[
              { label: "Priority",  value: cfg.label,     color: cfg.color },
              { label: "Category",  value: catCfg.label,  color: catCfg.color },
              { label: "Received",  value: selected.time, color: T.luxuryBrown },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase", color: T.taupe, marginBottom: 5 }}>{label}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>

          {selected.action && (
            <Button variant="primary" size="lg" fullWidth iconRight={ArrowRight} className="mb-2.5">
              {selected.action}
            </Button>
          )}
          <Button variant="secondary" size="md" fullWidth iconLeft={Check} onClick={() => { markRead(selected.id); setSelected(null); }}>
            Mark as read
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
