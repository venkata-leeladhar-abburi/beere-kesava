import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { T, F, inputStyle, labelStyle } from "./theme";
import { JariUnit, jariFromReels, jariToReels, jariGrams, trimNum } from "./jariUtils";

/**
 * Jari quantity input. The stored value is always reels; the operator can key
 * it in as reels or buns (1 reel = 4 buns) and always sees the gram equivalent.
 */
export function JariWeightField({ reels, onChange }: { reels: string; onChange: (reels: string) => void }) {
  const [unit, setUnit] = useState<JariUnit>("reels");
  const reelsNum = parseFloat(reels) || 0;
  const shown = reels === "" ? "" : trimNum(jariFromReels(reelsNum, unit));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <label style={{ ...labelStyle, marginBottom: 3 }}>Jari ({unit})</label>
        <div style={{ display: "flex", background: "rgba(110,15,45,0.06)", borderRadius: 999, padding: 2, marginBottom: 3 }}>
          {(["reels", "buns"] as JariUnit[]).map(u => (
            <button key={u} type="button" onClick={() => setUnit(u)}
              style={{
                border: "none", borderRadius: 999, padding: "3px 10px", cursor: "pointer",
                fontFamily: F.ui, fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                background: unit === u ? T.luxuryBrown : "transparent",
                color: unit === u ? "#FFF" : T.taupe,
              }}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <input aria-label="0" type="number" value={shown} placeholder="0"
        onChange={e => {
          const v = e.target.value;
          onChange(v === "" ? "" : trimNum(jariToReels(parseFloat(v) || 0, unit)));
        }}
        style={inputStyle} />
      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 4 }}>
        {trimNum(reelsNum)} reels · {trimNum(jariFromReels(reelsNum, "buns"))} buns · {trimNum(jariGrams(reelsNum), 0)}g
      </div>
    </div>
  );
}

export function SectionTitle({ children, link }: { children: React.ReactNode; link?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: T.royalBurgundy, flexShrink: 0 }} />
        <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>{children}</span>
      </div>
      {link}
    </div>
  );
}

export function GoldLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.antiqueGold, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
    >
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SAREE TYPE COMBOBOX
// ═══════════════════════════════════════════════════════════════════════════
export function SareeTypeCombobox({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = options
    .filter(o => o.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const showNew = query.trim() && !options.some(o => o.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={inputStyle}
        placeholder="e.g. Self Brocade or type a new name…"
        autoComplete="off"
      />
      <AnimatePresence>
        {open && (filtered.length > 0 || showNew) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 500,
              background: "#FFFDF9", borderRadius: 10, boxShadow: "0 8px 28px rgba(44,6,27,0.14)",
              border: `1px solid ${T.borderDef}`, overflow: "hidden", maxHeight: 220, overflowY: "auto",
            }}
          >
            {filtered.map(opt => (
              <button key={opt} onMouseDown={() => { onChange(opt); setQuery(opt); setOpen(false); }}
                style={{ width: "100%", display: "block", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {opt}
              </button>
            ))}
            {showNew && (
              <button onMouseDown={() => { onChange(query.trim()); setOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, textAlign: "left", padding: "9px 14px", border: "none", borderTop: filtered.length > 0 ? `1px solid ${T.borderDef}` : "none", background: "rgba(110,15,45,0.03)", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.royalBurgundy }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(110,15,45,0.03)")}
              >
                <Plus size={13} /> Add &ldquo;{query.trim()}&rdquo; as new type
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
