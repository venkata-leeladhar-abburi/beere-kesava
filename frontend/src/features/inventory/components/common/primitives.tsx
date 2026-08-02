// ── Shared primitives ──────────────────────────────────────────────────────
import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, Truck, AlertTriangle, Clock, ChevronDown } from "lucide-react";
import { T, F, EASE, inp } from "../theme";

// ── Status badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    "Ready for Dispatch":   { bg: T.greenBg,   color: T.green,   border: "rgba(30,102,64,0.20)"  },
    "Dispatched":           { bg: "rgba(59,35,20,0.08)", color: T.luxuryBrown, border: "rgba(59,35,20,0.18)" },
    "Damaged — Review Needed": { bg: T.crimsonBg, color: T.crimson, border: "rgba(192,57,43,0.20)" },
    "QC Passed":            { bg: "rgba(200,155,71,0.14)", color: "#8B6018", border: "rgba(200,155,71,0.32)" },
  };
  const s = cfg[status] ?? cfg["Ready for Dispatch"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" as const }}>
      {status === "Ready for Dispatch"      && <CheckCircle2 size={10} />}
      {status === "Dispatched"              && <Truck size={10} />}
      {status === "Damaged — Review Needed" && <AlertTriangle size={10} />}
      {status === "QC Passed"               && <Clock size={10} />}
      {status}
    </span>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
export function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>
        {label} {req && <span style={{ color: T.crimson }}>*</span>}
      </div>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...inp, fontFamily: mono ? F.mono : F.ui }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
      onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }}
    />
  );
}

export function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...inp }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.royalBurgundy; }}
      onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = "rgba(110,15,45,0.18)"; }}
    />
  );
}

export function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inp, appearance: "none", cursor: "pointer", paddingRight: 32 }}
        onFocus={e => { (e.target as HTMLSelectElement).style.borderColor = T.royalBurgundy; }}
        onBlur={e =>  { (e.target as HTMLSelectElement).style.borderColor = "rgba(110,15,45,0.18)"; }}
      >{children}</select>
      <ChevronDown size={14} color={T.taupe} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
      style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: T.deepWine, color: "#FFF", padding: "14px 22px", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, zIndex: 600, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 9 }}>
      <CheckCircle2 size={16} color={T.antiqueGold} /> {msg}
    </motion.div>
  );
}
