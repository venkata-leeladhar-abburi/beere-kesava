import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Send, X } from "lucide-react";
import { C, F } from "../theme";

export function LowStockDialog({
  open, onClose, priority, setPriority, message, setMessage, onSend,
}: {
  open: boolean; onClose: () => void;
  priority: "urgent" | "normal"; setPriority: (p: "urgent" | "normal") => void;
  message: string; setMessage: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{ background: "#FFF", borderRadius: 24, width: "100%", maxWidth: 520, boxShadow: "0 24px 80px rgba(44,24,16,0.22)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "28px 32px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(192,57,43,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle size={24} color="#FF8080" />
                </div>
                <div>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Report Low Stock</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Send an alert to Admin & Superadmin</div>
                </div>
                <button onClick={onClose} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={18} color="rgba(255,255,255,0.70)" />
                </button>
              </div>
            </div>
            <div style={{ padding: "28px 32px 32px" }}>
              {/* Stock status */}
              <div style={{ background: "rgba(192,57,43,0.06)", border: `1.5px solid rgba(192,57,43,0.22)`, borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Current shop stock</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.crim }}>84</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Minimum threshold</span>
                  <span style={{ fontFamily: F.m, fontSize: 14, color: C.muted }}>100 sarees</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(192,57,43,0.12)", overflow: "hidden" }}>
                  <div style={{ width: "84%", height: "100%", background: `linear-gradient(90deg, ${C.crim}, #E05050)`, borderRadius: 4 }} />
                </div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.crim, marginTop: 8, fontWeight: 600 }}>↓ 16 below threshold</div>
              </div>
              {/* Priority */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>Priority level</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {(["urgent", "normal"] as const).map(p => (
                    <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, height: 48, borderRadius: 12, border: `2px solid ${priority === p ? (p === "urgent" ? C.crim : C.burg) : C.bdr}`, background: priority === p ? (p === "urgent" ? "rgba(192,57,43,0.08)" : "rgba(107,26,42,0.06)") : "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: priority === p ? (p === "urgent" ? C.crim : C.burg) : C.muted, cursor: "pointer" }}>
                      {p === "urgent" ? "🔴 Urgent" : "🟡 Normal"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Message */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Additional note <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></div>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="E.g. Festival orders incoming — need Kanjivaram and plain silks urgently..." rows={3}
                  style={{ width: "100%", minHeight: 100, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 14, padding: "14px 16px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", resize: "none", boxSizing: "border-box" as const }} />
              </div>
              {/* Recipients note */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(107,26,42,0.05)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 16px", marginBottom: 24 }}>
                <Send size={14} color={C.muted} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>This report will be sent to <strong style={{ color: C.text }}>Admin</strong> and <strong style={{ color: C.text }}>Superadmin</strong></span>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={onClose} style={{ flex: 1, height: 52, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.muted, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={onSend} style={{ flex: 2, height: 52, borderRadius: 999, border: "none", background: C.crim, fontFamily: F.u, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 18px rgba(192,57,43,0.35)" }}>
                  <Send size={17} /> Send Report to Admin
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
