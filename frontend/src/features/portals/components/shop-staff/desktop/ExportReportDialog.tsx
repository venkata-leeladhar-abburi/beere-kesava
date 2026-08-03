import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, FileText, X } from "lucide-react";
import { C, F } from "../theme";

export function ExportReportDialog({
  dialog, onClose, format, setFormat, done, setDone,
}: {
  dialog: { label: string } | null; onClose: () => void;
  format: "pdf" | "csv" | "excel"; setFormat: (f: "pdf" | "csv" | "excel") => void;
  done: boolean; setDone: (v: boolean) => void;
}) {
  return (
    <AnimatePresence>
      {dialog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed" as const, inset: 0, zIndex: 9999, background: "rgba(20,8,12,0.60)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{ background: "#FFF", borderRadius: 24, width: "100%", maxWidth: 480, boxShadow: "0 24px 80px rgba(44,24,16,0.22)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "28px 32px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(196,146,58,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={24} color={C.gold} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: "#FFF" }}>Export Report</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{dialog!.label}</div>
                </div>
                <button onClick={onClose} style={{ background: "rgba(255,255,255,0.10)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={18} color="rgba(255,255,255,0.70)" />
                </button>
              </div>
            </div>
            <div style={{ padding: "28px 32px 32px" }}>
              {done ? (
                <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                    <Check size={36} color={C.green} />
                  </div>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 10 }}>Export Ready!</div>
                  <div style={{ fontFamily: F.u, fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
                    Your <strong style={{ color: C.text }}>{dialog!.label}</strong> report has been exported as <strong style={{ color: C.text }}>{format.toUpperCase()}</strong>. Check your downloads folder.
                  </div>
                  <button onClick={onClose} style={{ width: "100%", height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer" }}>Done</button>
                </div>
              ) : (
                <>
                  {/* Format selection */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 14 }}>Export format</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      {([
                        { key: "pdf" as const, label: "PDF", icon: "📄", desc: "Print-ready" },
                        { key: "csv" as const, label: "CSV", icon: "📊", desc: "Spreadsheet" },
                        { key: "excel" as const, label: "Excel", icon: "📗", desc: "Advanced" },
                      ]).map(f => (
                        <button key={f.key} onClick={() => setFormat(f.key)} style={{ flex: 1, padding: "16px 10px", borderRadius: 14, border: `2px solid ${format === f.key ? C.burg : C.bdr}`, background: format === f.key ? "rgba(107,26,42,0.06)" : "#FFF", cursor: "pointer", textAlign: "center" as const }}>
                          <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: format === f.key ? C.burg : C.text, marginBottom: 2 }}>{f.label}</div>
                          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{f.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* What's included */}
                  <div style={{ background: "#F8F4F0", borderRadius: 14, padding: "16px 18px", marginBottom: 24 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Includes</div>
                    {["Sale ID, customer name, design code", "Payment method and amount", "Timestamp and date", "Running totals and subtotals"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
                        <Check size={14} color={C.green} />
                        <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={onClose} style={{ flex: 1, height: 52, borderRadius: 999, border: `1.5px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.muted, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => setDone(true)} style={{ flex: 2, height: 52, borderRadius: 999, border: "none", background: C.burg, fontFamily: F.u, fontWeight: 700, fontSize: 15, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(107,26,42,0.30)" }}>
                      <FileText size={17} /> Export as {format.toUpperCase()}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
