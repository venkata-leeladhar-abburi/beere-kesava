import React from "react";
import { motion } from "motion/react";
import { DispatchRecord } from "../../design-library/contexts/DesignLibraryContext";

// Extracted out of BatchCreationPage.tsx so FactoryLoomPage.tsx (which also needs
// this modal) doesn't have to import from BatchCreationPage.tsx, which in turn
// imports from FactoryLoomPage.tsx — that mutual import was a circular dependency.
const T = {
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

function PickerShell({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(30,10,20,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <motion.div onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        style={{ background: T.warmIvory, borderRadius: 20, width, maxWidth: "calc(100vw - 48px)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ paddingTop: 16 }}>{children}</div>
      </motion.div>
    </div>
  );
}

export function DispatchDetailsModal({ weaverName, records, onClose }: { weaverName: string; records: DispatchRecord[]; onClose: () => void }) {
  return (
    <PickerShell title={`Design Dispatch — ${weaverName}`} onClose={onClose} width={460}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {records.map(d => (
          <div key={d.id} style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{d.id}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.sentAt}</span>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 4 }}>Instructions</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.55, marginBottom: d.colorSlipImage ? 12 : 0 }}>{d.instructions}</div>
            {d.colorSlipImage && (
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 6 }}>Color Slip</div>
                <img src={d.colorSlipImage} alt="Color slip" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.borderDef}` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </PickerShell>
  );
}
