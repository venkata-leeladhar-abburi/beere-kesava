import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { Button, Input } from "../../../../shared/ui/primitives";
import { T, F, labelStyle } from "./theme";
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
            <Button key={u} type="button" variant="ghost" size="sm" onClick={() => setUnit(u)}
              className={`h-auto rounded-full px-2.5 py-[3px] text-[12px] font-semibold capitalize font-[var(--font-ui)] ${
                unit === u ? "bg-[#3B2314] text-white hover:bg-[#3B2314] hover:text-white" : "text-[var(--text-tertiary)]"
              }`}>
              {u}
            </Button>
          ))}
        </div>
      </div>
      <Input aria-label="0" type="number" value={shown} placeholder="0"
        onChange={e => {
          const v = e.target.value;
          onChange(v === "" ? "" : trimNum(jariToReels(parseFloat(v) || 0, unit)));
        }}
        className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
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
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]"
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
              <Button key={opt} variant="ghost" onMouseDown={() => { onChange(opt); setQuery(opt); setOpen(false); }}
                className="h-auto w-full justify-start rounded-none px-3.5 py-[9px] text-[13px] font-normal text-[#3B2314] hover:bg-[rgba(110,15,45,0.05)]"
              >
                {opt}
              </Button>
            ))}
            {showNew && (
              <Button variant="ghost" onMouseDown={() => { onChange(query.trim()); setOpen(false); }}
                className={`h-auto w-full justify-start gap-2 rounded-none px-3.5 py-[9px] text-[13px] font-normal text-[#6E0F2D] bg-[rgba(110,15,45,0.03)] hover:bg-[rgba(110,15,45,0.07)] ${filtered.length > 0 ? "border-t border-[rgba(110,15,45,0.10)]" : ""}`}
              >
                <Plus size={13} /> Add &ldquo;{query.trim()}&rdquo; as new type
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
