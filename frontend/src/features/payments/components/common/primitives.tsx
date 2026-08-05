import React, { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";

import { F, T } from "../../theme";

// helper: initials avatar
export function Pip({ initials, bg, size = 36 }: { initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid rgba(255,255,255,0.55)" }}>
      <span style={{ fontFamily: F.ui, fontSize: size * 0.33, fontWeight: 700, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{initials}</span>
    </div>
  );
}

// helper: status badge
export function StatusBadge({ status }: { status: "Paid" | "Pending" }) {
  const paid = status === "Paid";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: paid ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)", color: paid ? T.green : "#8B6018" }}>
      {paid ? <CheckCircle2 size={11} /> : <Clock size={11} />}{status}
    </span>
  );
}

// helper: ActionModal
export function ActionModal({ open, onClose, title, desc, actionLabel, icon: Icon = CheckCircle2, hideAction = false }: any) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  
  if (!open) return null;
  
  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1200);
  };
  
  if (done) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(44,24,16,0.60)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#FFFDF9", borderRadius: 20, padding: 48, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <CheckCircle2 size={48} color={T.green} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Success</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 24 }}>
            Action completed successfully.
          </div>
          <button onClick={() => { setDone(false); onClose(); }} style={{ height: 44, padding: "0 32px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,24,16,0.60)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#FFFDF9", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
             <Icon size={22} color={T.royalBurgundy} />
          </div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 32 }}>
          {desc}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 40, padding: "0 20px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>Cancel</button>
          {!hideAction && (
            <button onClick={handleAction} style={{ height: 40, padding: "0 20px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {loading ? "Processing..." : actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// helper: dropdown button
export function DropBtn({ value, options, onChange }: { value?: string, options: string[], onChange?: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange?.(e.target.value)} style={{ padding: "8px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer", outline: "none" }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}
