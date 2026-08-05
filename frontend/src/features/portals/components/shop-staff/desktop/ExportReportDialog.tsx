import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, FileText, X } from "lucide-react";
import { C, F } from "../theme";
import { Button, IconButton } from "../../../../../shared/ui/primitives";

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
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Export Report</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{dialog!.label}</div>
                </div>
                <IconButton
                  icon={X}
                  label="Close"
                  onClick={onClose}
                  variant="ghost"
                  shape="circle"
                  className="bg-white/10 text-white/70 w-9 h-9"
                />
              </div>
            </div>
            <div style={{ padding: "28px 32px 32px" }}>
              {done ? (
                <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                    <Check size={36} color={C.green} />
                  </div>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 10 }}>Export Ready!</div>
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
                    Your <strong style={{ color: C.text }}>{dialog!.label}</strong> report has been exported as <strong style={{ color: C.text }}>{format.toUpperCase()}</strong>. Check your downloads folder.
                  </div>
                  <Button onClick={onClose} fullWidth className="h-[52px] rounded-full border-none bg-[#6B1A2A] font-bold text-sm text-white">Done</Button>
                </div>
              ) : (
                <>
                  {/* Format selection */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 14 }}>Export format</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      {([
                        { key: "pdf" as const, label: "PDF", icon: "📄", desc: "Print-ready" },
                        { key: "csv" as const, label: "CSV", icon: "📊", desc: "Spreadsheet" },
                        { key: "excel" as const, label: "Excel", icon: "📗", desc: "Advanced" },
                      ]).map(f => (
                        <Button
                          key={f.key}
                          onClick={() => setFormat(f.key)}
                          variant="ghost"
                          className={
                            "flex-1 h-auto py-4 px-2.5 rounded-2xl border-2 text-center flex-col " +
                            (format === f.key ? "border-[#6B1A2A] bg-[rgba(107,26,42,0.06)]" : "border-[rgba(139,26,46,0.12)] bg-white")
                          }
                        >
                          <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: format === f.key ? C.burg : C.text, marginBottom: 2 }}>{f.label}</div>
                          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{f.desc}</div>
                        </Button>
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
                    <Button onClick={onClose} className="flex-1 h-[52px] rounded-full border-[1.5px] border-[rgba(139,26,46,0.12)] bg-white font-semibold text-sm text-[#69635E]">Cancel</Button>
                    <Button onClick={() => setDone(true)} className="flex-[2] h-[52px] rounded-full border-none bg-[#6B1A2A] font-bold text-sm text-white gap-2 shadow-[0_4px_16px_rgba(107,26,42,0.30)]">
                      <FileText size={17} /> Export as {format.toUpperCase()}
                    </Button>
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
